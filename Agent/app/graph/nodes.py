from typing import Dict, Any, List
from datetime import datetime
from openai import AsyncOpenAI
import asyncio

from app.graph.state import SwapValidationState
from app.graph.tools import laravel_client
from app.config import get_settings
import logging

settings = get_settings()
logger = logging.getLogger(__name__)


openai_client = AsyncOpenAI(api_key=settings.openai_api_key)


FATIGUE_HIGH_RISK_THRESHOLD = 60 


SHIFT_FATIGUE_IMPACT = {
    'night': 15,
    'evening': 8,
    'day': 5
}


REASON_FORMAT_MAP = {
    'vacation': 'on vacation',
    'sick': 'on sick leave',
    'personal': 'unavailable (personal day)',
    'appointment': 'has an appointment',
    'other': 'marked as unavailable',
    None: 'marked as unavailable'
}




async def load_context_node(state: SwapValidationState) -> Dict[str, Any]:

    logger.info(f"Loading context for swap {state['swap_id']}")
    
    try:
       
        results = await asyncio.gather(
            laravel_client.get_employee(state['requester_id']),
            laravel_client.get_employee(state['target_employee_id']),
            laravel_client.get_shift(state['requester_shift_id']),
            laravel_client.get_shift(state['target_shift_id']),
            return_exceptions=True
        )
        
        requester_data, target_data, requester_shift_data, target_shift_data = results
        
       
        errors = []
        for i, (name, result) in enumerate([
            ("requester employee", requester_data),
            ("target employee", target_data),
            ("requester shift", requester_shift_data),
            ("target shift", target_shift_data)
        ]):
            if isinstance(result, Exception):
                errors.append(f"Failed to load {name}: {str(result)}")
                logger.error(f"Failed to load {name}: {result}")
        
        if errors:
            return {
                **state,
                "error": "; ".join(errors)
            }
        
        logger.info("Context loaded successfully (parallel)")
        
        return {
            **state,
            "requester_data": requester_data,
            "target_data": target_data,
            "requester_shift_data": requester_shift_data,
            "target_shift_data": target_shift_data,
            "error": None
        }
        
    except Exception as e:
        logger.error(f"Failed to load context: {str(e)}")
        return {
            **state,
            "error": f"Failed to load context: {str(e)}"
        }




async def check_availability_node(state: SwapValidationState) -> Dict[str, Any]:
    logger.info(f"Checking availability for swap {state['swap_id']}")
    
    if state.get('error'):
        return state
    
    try:
        requester_shift_date = state['requester_shift_data'].get('shift_date')
        target_shift_date = state['target_shift_data'].get('shift_date')
        
        requester_name = state.get('requester_data', {}).get('full_name', 'Requester')
        target_name = state.get('target_data', {}).get('full_name', 'Target employee')
        
        requester_avail, target_avail = await asyncio.gather(
            laravel_client.get_employee_availability(state['requester_id'], target_shift_date),
            laravel_client.get_employee_availability(state['target_employee_id'], requester_shift_date)
        )
        
        requester_available = requester_avail.get('is_available', False) if requester_avail else True
        target_available = target_avail.get('is_available', False) if target_avail else True
        
        passed = requester_available and target_available
        
     
        reasons = []
        if not requester_available:
            raw_reason = requester_avail.get('reason')
            formatted_reason = REASON_FORMAT_MAP.get(raw_reason, REASON_FORMAT_MAP.get('other'))
            reasons.append(f"{requester_name} is {formatted_reason} on {target_shift_date}")
        if not target_available:
            raw_reason = target_avail.get('reason')
            formatted_reason = REASON_FORMAT_MAP.get(raw_reason, REASON_FORMAT_MAP.get('other'))
            reasons.append(f"{target_name} is {formatted_reason} on {requester_shift_date}")
        
        check_result = {
            "check_name": "availability",
            "passed": passed,
            "severity": "hard",  # Hard check - blocks swap if failed
            "message": "Both employees available" if passed else "; ".join(reasons),
            "details": {
                "requester_available": requester_available,
                "target_available": target_available,
                "requester_shift_date": requester_shift_date,
                "target_shift_date": target_shift_date
            }
        }
        
        logger.info(f"Availability check: {'PASSED' if passed else 'FAILED'}")
        
        return {
            **state,
            "availability_check": check_result
        }
        
    except Exception as e:
        logger.error(f"Availability check error: {str(e)}")
        return {
            **state,
            "availability_check": {
                "check_name": "availability",
                "passed": False,
                "severity": "hard",
                "message": f"Could not verify availability: {str(e)}",
                "details": {"error": str(e)}
            }
        }

def calculate_realistic_fatigue_impact(
    current_score: int,
    new_shift_type: str,
    new_shift_date: str,
    old_shift_date: str
) -> int:
   
    base_increase = SHIFT_FATIGUE_IMPACT.get(new_shift_type, 10)
    
    try:
        old_date = datetime.fromisoformat(old_shift_date.replace('Z', '+00:00')) if isinstance(old_shift_date, str) else old_shift_date
        new_date = datetime.fromisoformat(new_shift_date.replace('Z', '+00:00')) if isinstance(new_shift_date, str) else new_shift_date
        days_between = abs((new_date - old_date).days)
    except:
        days_between = 1 
    if days_between >= 2:
        recovery_factor = 0.5  
    elif days_between == 1:
        recovery_factor = 0.8  
    else:
        recovery_factor = 1.2  
    
    if current_score > 50:
        fatigue_multiplier = 1.3  
    elif current_score > 30:
        fatigue_multiplier = 1.1    
    else:
        fatigue_multiplier = 1.0
    
    total_increase = int(base_increase * recovery_factor * fatigue_multiplier)
    
    return current_score + total_increase


async def check_fatigue_node(state: SwapValidationState) -> Dict[str, Any]:
    logger.info(f"Checking fatigue for swap {state['swap_id']}")
    
    if state.get('error'):
        return state
    
    try:
        requester_fatigue, target_fatigue = await asyncio.gather(
            laravel_client.get_fatigue_score(state['requester_id']),
            laravel_client.get_fatigue_score(state['target_employee_id'])
        )
        
        requester_current_score = requester_fatigue.get('total_score', 0)
        target_current_score = target_fatigue.get('total_score', 0)
        
        requester_shift = state.get('requester_shift_data', {})
        target_shift = state.get('target_shift_data', {})
        
        requester_after_swap = calculate_realistic_fatigue_impact(
            requester_current_score,
            target_shift.get('shift_type', 'day'),
            target_shift.get('shift_date', ''),
            requester_shift.get('shift_date', '')
        )
        
        target_after_swap = calculate_realistic_fatigue_impact(
            target_current_score,
            requester_shift.get('shift_type', 'day'),
            requester_shift.get('shift_date', ''),
            target_shift.get('shift_date', '')
        )
        
        requester_at_risk = requester_after_swap >= FATIGUE_HIGH_RISK_THRESHOLD
        target_at_risk = target_after_swap >= FATIGUE_HIGH_RISK_THRESHOLD
        
        passed = not (requester_at_risk or target_at_risk)
        
        fatigue_context = f"""
        Shift Swap Fatigue Analysis:
        
        Requester:
        - Current fatigue score: {requester_current_score}
        - Projected after swap: {requester_after_swap}
        - Risk level: {requester_fatigue.get('risk_level', 'unknown')}
        
        Target Employee:
        - Current fatigue score: {target_current_score}
        - Projected after swap: {target_after_swap}
        - Risk level: {target_fatigue.get('risk_level', 'unknown')}
        
        High risk threshold: {FATIGUE_HIGH_RISK_THRESHOLD}
        """
        
        ai_response = await openai_client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "system",
                    "content": "You are a workplace safety analyst. Briefly assess the fatigue risk for this shift swap in 1-2 sentences."
                },
                {
                    "role": "user", 
                    "content": fatigue_context
                }
            ],
            max_tokens=100,
            temperature=0.3
        )
        
        ai_analysis = ai_response.choices[0].message.content.strip()
        check_result = {
            "check_name": "fatigue",
            "passed": passed,
            "severity": "hard",
            "message": ai_analysis if not passed else "Fatigue levels are within safe limits",
            "details": {
                "requester_current": requester_current_score,
                "requester_after": requester_after_swap,
                "requester_risk_level": requester_fatigue.get('risk_level'),
                "target_current": target_current_score,
                "target_after": target_after_swap,
                "target_risk_level": target_fatigue.get('risk_level'),
                "threshold": FATIGUE_HIGH_RISK_THRESHOLD,
                "ai_analysis": ai_analysis
            }
        }
        
        logger.info(f"Fatigue check: {'PASSED' if passed else 'FAILED'}")
        
        return {
            **state,
            "fatigue_check": check_result
        }
        
    except Exception as e:
        logger.error(f"Fatigue check error: {str(e)}")
        return {
            **state,
            "fatigue_check": {
                "check_name": "fatigue",
                "passed": True,  
                "severity": "soft",
                "message": f"Could not fully assess fatigue: {str(e)}",
                "details": {"error": str(e), "needs_manual_review": True}
            }
        }

async def check_staffing_node(state: SwapValidationState) -> Dict[str, Any]:
    logger.info(f"Checking staffing for swap {state['swap_id']}")
    
    if state.get('error'):
        return state
    
    try:
        requester_shift_assignments = await laravel_client.get_shift_assignments(
            state['requester_shift_id']
        )
        target_shift_assignments = await laravel_client.get_shift_assignments(
            state['target_shift_id']
        )
        requester_shift = state['requester_shift_data']
        target_shift = state['target_shift_data']
        
        requester_required = requester_shift.get('required_staff_count', 1)
        target_required = target_shift.get('required_staff_count', 1)
        
        requester_current_count = len(requester_shift_assignments.get('data', []))
        target_current_count = len(target_shift_assignments.get('data', []))
        
        requester_adequate = requester_current_count >= requester_required
        target_adequate = target_current_count >= target_required
        
        passed = requester_adequate and target_adequate
        
        if passed:
            message = "Staffing levels maintained after swap"
        else:
            problems = []
            if not requester_adequate:
                problems.append(f"Requester's shift needs {requester_required} staff, has {requester_current_count}")
            if not target_adequate:
                problems.append(f"Target's shift needs {target_required} staff, has {target_current_count}")
            message = "; ".join(problems)
        
        check_result = {
            "check_name": "staffing",
            "passed": passed,
            "severity": "soft",  # Manager can override if needed
            "message": message,
            "details": {
                "requester_shift_required": requester_required,
                "requester_shift_current": requester_current_count,
                "target_shift_required": target_required,
                "target_shift_current": target_current_count
            }
        }
        
        logger.info(f"Staffing check: {'PASSED' if passed else 'NEEDS REVIEW'}")
        
        return {
            **state,
            "staffing_check": check_result
        }
        
    except Exception as e:
        logger.error(f"Staffing check error: {str(e)}")
        return {
            **state,
            "staffing_check": {
                "check_name": "staffing",
                "passed": True,  # Don't block on error
                "severity": "soft",
                "message": f"Could not verify staffing: {str(e)}",
                "details": {"error": str(e), "needs_manual_review": True}
            }
        }



COMPLIANCE_RULES = {
    'max_weekly_hours': 56,
    'min_rest_between_shifts_hours': 8,
    'max_consecutive_days': 6,
    'max_daily_hours': 12
}


def parse_shift_datetime(shift_data: Dict[str, Any], time_field: str) -> datetime:
    date_str = shift_data.get('shift_date', '')
    time_str = shift_data.get(time_field, '00:00:00')
    try:
        return datetime.fromisoformat(f"{date_str}T{time_str}".replace('Z', '+00:00'))
    except:
        return datetime.now()


def calculate_rest_hours(shift1_end: datetime, shift2_start: datetime) -> float:
    delta = shift2_start - shift1_end
    return delta.total_seconds() / 3600


async def check_compliance_node(state: SwapValidationState) -> Dict[str, Any]:
    logger.info(f"Checking compliance for swap {state['swap_id']}")
    
    if state.get('error'):
        return state
    
    violations = []
    warnings = []
    checks_performed = []
    
    requester_shift = state.get('requester_shift_data', {})
    target_shift = state.get('target_shift_data', {})
    requester_data = state.get('requester_data', {})
    target_data = state.get('target_data', {})
    
    requester_name = requester_data.get('full_name', 'Requester')
    target_name = target_data.get('full_name', 'Target Employee')
    
    try:
        checks_performed.append('minimum_rest_period')
        
        requester_new_shift_start = parse_shift_datetime(target_shift, 'start_time')
        requester_old_shift_end = parse_shift_datetime(requester_shift, 'end_time')
        
        target_new_shift_start = parse_shift_datetime(requester_shift, 'start_time')
        target_old_shift_end = parse_shift_datetime(target_shift, 'end_time')
        
        rest_hours_requester = abs(calculate_rest_hours(requester_old_shift_end, requester_new_shift_start))
        rest_hours_target = abs(calculate_rest_hours(target_old_shift_end, target_new_shift_start))
        
        min_rest = COMPLIANCE_RULES['min_rest_between_shifts_hours']
        
        if rest_hours_requester < min_rest and rest_hours_requester > 0:
            violations.append(
                f"{requester_name} would have only {rest_hours_requester:.1f}h rest (minimum: {min_rest}h required)"
            )
        
        if rest_hours_target < min_rest and rest_hours_target > 0:
            violations.append(
                f"{target_name} would have only {rest_hours_target:.1f}h rest (minimum: {min_rest}h required)"
            )
        
        checks_performed.append('max_daily_hours')
        
        def get_shift_hours(shift: Dict[str, Any]) -> float:
            try:
                start = parse_shift_datetime(shift, 'start_time')
                end = parse_shift_datetime(shift, 'end_time')
                hours = (end - start).total_seconds() / 3600
                if hours < 0:
                    hours += 24
                return hours
            except:
                return 8
        
        requester_new_hours = get_shift_hours(target_shift)
        target_new_hours = get_shift_hours(requester_shift)
        max_daily = COMPLIANCE_RULES['max_daily_hours']
        
        if requester_new_hours > max_daily:
            warnings.append(f"{requester_name}'s new shift is {requester_new_hours:.1f}h (exceeds {max_daily}h daily limit)")
        
        if target_new_hours > max_daily:
            warnings.append(f"{target_name}'s new shift is {target_new_hours:.1f}h (exceeds {max_daily}h daily limit)")
        
        checks_performed.append('night_shift_rules')
        
        requester_new_type = target_shift.get('shift_type', 'day')
        target_new_type = requester_shift.get('shift_type', 'day')
        
        if requester_new_type == 'night':
            warnings.append(f"{requester_name} will be switching to a night shift - verify they are eligible for night work")
        
        if target_new_type == 'night':
            warnings.append(f"{target_name} will be switching to a night shift - verify they are eligible for night work")
        
        checks_performed.append('weekly_hours_and_consecutive_days')
        
        requester_stats, target_stats = await asyncio.gather(
            laravel_client.get_employee_shifts_stats(state['requester_id']),
            laravel_client.get_employee_shifts_stats(state['target_employee_id']),
            return_exceptions=True
        )
        
        if not isinstance(requester_stats, Exception) and requester_stats:
            month_stats = requester_stats.get('this_month_stats', {})
            total_hours = month_stats.get('total_hours', 0)
            consecutive_days = month_stats.get('consecutive_days', 0)
            max_weekly = COMPLIANCE_RULES['max_weekly_hours']
            max_consecutive = COMPLIANCE_RULES['max_consecutive_days']
            
            if total_hours >= max_weekly:
                warnings.append(f"{requester_name} has worked {total_hours}h this month (approaching {max_weekly}h weekly limit)")
            
            if consecutive_days >= max_consecutive:
                violations.append(f"{requester_name} has worked {consecutive_days} consecutive days (max: {max_consecutive})")
        
        if not isinstance(target_stats, Exception) and target_stats:
            month_stats = target_stats.get('this_month_stats', {})
            total_hours = month_stats.get('total_hours', 0)
            consecutive_days = month_stats.get('consecutive_days', 0)
            max_weekly = COMPLIANCE_RULES['max_weekly_hours']
            max_consecutive = COMPLIANCE_RULES['max_consecutive_days']
            
            if total_hours >= max_weekly:
                warnings.append(f"{target_name} has worked {total_hours}h this month (approaching {max_weekly}h weekly limit)")
            
            if consecutive_days >= max_consecutive:
                violations.append(f"{target_name} has worked {consecutive_days} consecutive days (max: {max_consecutive})")
        
    except Exception as e:
        logger.error(f"Compliance check error: {str(e)}")
        return {
            **state,
            "compliance_check": {
                "check_name": "compliance",
                "passed": True,
                "severity": "soft",
                "message": f"Could not fully verify compliance: {str(e)}",
                "details": {"error": str(e), "needs_manual_review": True}
            }
        }
    
    passed = len(violations) == 0
    
    if violations:
        message = f"Compliance violations: {'; '.join(violations)}"
        severity = "hard"
    elif warnings:
        message = f"Compliance passed with warnings: {'; '.join(warnings)}"
        severity = "soft"
        passed = True
    else:
        message = "All compliance checks passed"
        severity = "hard"
    
    check_result = {
        "check_name": "compliance",
        "passed": passed,
        "severity": severity,
        "message": message,
        "details": {
            "checks_performed": checks_performed,
            "violations": violations,
            "warnings": warnings,
            "rules_applied": COMPLIANCE_RULES
        }
    }
    
    logger.info(f"Compliance check: {'PASSED' if passed else 'FAILED'} ({len(violations)} violations, {len(warnings)} warnings)")
    
    return {
        **state,
        "compliance_check": check_result
    }


# Node 6: Make Decision


def generate_suggestions(failed_checks: List[Dict[str, Any]], state: SwapValidationState) -> List[Dict[str, Any]]:
    suggestions = []
    
    for check in failed_checks:
        check_name = check.get('check_name')
        
        if check_name == 'availability':
            suggestions.append({
                "type": "alternative_dates",
                "message": "Consider requesting a swap for a different date when both employees are available",
                "action": "check_calendar"
            })
            suggestions.append({
                "type": "alternative_employee",
                "message": "Try finding another colleague who is available for this shift",
                "action": "find_available_employees"
            })
        
        elif check_name == 'fatigue':
            requester_score = state.get('fatigue_check', {}).get('details', {}).get('requester_current', 0)
            days_to_recover = max(2, (requester_score - 40) // 10) if requester_score > 40 else 1
            suggestions.append({
                "type": "delay_swap",
                "message": f"Wait {days_to_recover} days for fatigue levels to recover before swapping",
                "action": "reschedule_later"
            })
            suggestions.append({
                "type": "shorter_shift",
                "message": "Consider swapping for a shorter or less demanding shift",
                "action": "find_easier_shift"
            })
        
        elif check_name == 'staffing':
            suggestions.append({
                "type": "manager_justification",
                "message": "Provide business justification for the swap despite staffing concerns",
                "action": "submit_justification"
            })
            suggestions.append({
                "type": "find_coverage",
                "message": "Arrange for additional coverage before proceeding with swap",
                "action": "request_coverage"
            })
        
        elif check_name == 'compliance':
            details = check.get('details', {})
            violations = details.get('violations', [])
            
            if any('rest' in v.lower() for v in violations):
                suggestions.append({
                    "type": "reschedule_shift",
                    "message": "Choose a shift that allows for the minimum 11-hour rest period between shifts",
                    "action": "find_compliant_shift"
                })
            
            suggestions.append({
                "type": "hr_review",
                "message": "Contact HR to review compliance requirements or request an exception",
                "action": "contact_hr"
            })
    
 
    if failed_checks:
        suggestions.append({
            "type": "manager_override",
            "message": "Request manual review and approval from your manager",
            "action": "escalate_to_manager"
        })
    
    return suggestions

async def make_decision_node(state: SwapValidationState) -> Dict[str, Any]:
    logger.info(f"Making decision for swap {state['swap_id']}")
    
    all_checks = []
    hard_failures = []
    soft_failures = []
    risk_factors = []
    
    checks_to_evaluate = [
        state.get('availability_check'),
        state.get('fatigue_check'),
        state.get('staffing_check'),
        state.get('compliance_check')
    ]
    
    for check in checks_to_evaluate:
        if check is None:
            continue
            
        all_checks.append(check)
        
        if not check.get('passed', True):
            if check.get('severity') == 'hard':
                hard_failures.append(check)
                risk_factors.append(f"[CRITICAL] {check['check_name']}: {check['message']}")
            else:
                soft_failures.append(check)
                risk_factors.append(f"[WARNING] {check['check_name']}: {check['message']}")
    
    if state.get('error'):
        return {
            **state,
            "decision": "requires_review",
            "confidence": 0.0,
            "reasoning": f"Workflow encountered an error: {state['error']}",
            "risk_factors": ["Workflow error - manual review required"],
            "all_checks": all_checks
        }
    
    if hard_failures:
        decision = "auto_reject"
        confidence = 0.95
    elif soft_failures:
        decision = "requires_review"
        confidence = 0.7
    else:
        decision = "auto_approve"
        confidence = 0.9
    
    requester_data = state.get('requester_data', {})
    target_data = state.get('target_data', {})
    requester_shift = state.get('requester_shift_data', {})
    target_shift = state.get('target_shift_data', {})
    
    decision_context = f"""
Shift Swap Decision Analysis:

SWAP REQUEST:
- Swap ID: {state['swap_id']}
- Requested by: {requester_data.get('full_name', 'Unknown')}
- Swap with: {target_data.get('full_name', 'Unknown')}
- Reason: {state.get('swap_reason', 'Not provided')}

SHIFTS INVOLVED:
- Requester's current shift: {requester_shift.get('shift_date', 'N/A')} ({requester_shift.get('shift_type', 'unknown')} shift)
- Target's current shift: {target_shift.get('shift_date', 'N/A')} ({target_shift.get('shift_type', 'unknown')} shift)

VALIDATION RESULTS:
{chr(10).join([
    f" {c['check_name']}: PASS - {c['message']}" if c['passed'] 
    else f" {c['check_name']}: FAIL ({c['severity']}) - {c['message']}"
    for c in all_checks
])}

DECISION: {decision.upper()}
CONFIDENCE: {confidence:.0%}

Provide a clear, empathetic explanation that:
1. States the decision (approved/rejected/needs review)
2. Explains the main reason(s)
3. If rejected or needs review, briefly mention what could help

Keep it professional but friendly, 2-3 sentences max.
"""
    
    try:
        ai_response = await openai_client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "system",
                    "content": "You are a friendly HR assistant helping explain shift swap decisions. Be clear, empathetic, and constructive. Use simple language that employees will understand."
                },
                {
                    "role": "user",
                    "content": decision_context
                }
            ],
            max_tokens=150,
            temperature=0.4
        )
        
        reasoning = ai_response.choices[0].message.content.strip()
        
    except Exception as e:
        logger.error(f"Failed to generate AI reasoning: {str(e)}")
        if decision == "auto_approve":
            reasoning = "All validation checks passed. This shift swap can be automatically approved."
        elif decision == "auto_reject":
            reasoning = f"One or more critical checks failed: {', '.join([c['check_name'] for c in hard_failures])}. This swap cannot proceed."
        else:
            reasoning = f"Some concerns were identified that require manager review: {', '.join([c['check_name'] for c in soft_failures])}."
    
    suggestions = []
    if decision != "auto_approve":
        all_failures = hard_failures + soft_failures
        suggestions = generate_suggestions(all_failures, state)
    
    logger.info(f"Decision: {decision} (confidence: {confidence}, suggestions: {len(suggestions)})")
    
    return {
        **state,
        "decision": decision,
        "confidence": confidence,
        "reasoning": reasoning,
        "risk_factors": risk_factors,
        "all_checks": all_checks,
        "suggestions": suggestions
    }

def should_continue_after_availability(state: SwapValidationState) -> str:
    check = state.get('availability_check') or {}  # Handle None
    if not check.get('passed', True) and check.get('severity') == 'hard':
        return "make_decision"  # Skip to decision on hard failure
    return "check_fatigue"


def should_continue_after_fatigue(state: SwapValidationState) -> str:
    check = state.get('fatigue_check') or {}  # Handle None
    if not check.get('passed', True) and check.get('severity') == 'hard':
        return "make_decision"  # Skip to decision on hard failure  
    return "check_staffing"
