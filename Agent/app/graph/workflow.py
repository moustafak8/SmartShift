"""
LangGraph workflow graph definition.

This module constructs the validation workflow using LangGraph's StateGraph.
The workflow executes validation nodes with conditional routing based on
check results.

Flow:
    START → load_context → check_availability
                               ↓ pass         ↓ fail
                         check_fatigue    make_decision (reject)
                               ↓ pass         ↓ fail
                         check_staffing   make_decision (reject)
                               ↓
                         check_compliance
                               ↓
                         make_decision → END
"""

from langgraph.graph import StateGraph, END
from app.graph.state import SwapValidationState
from app.graph.nodes import (
    load_context_node,
    check_availability_node,
    check_fatigue_node,
    check_staffing_node,
    check_compliance_node,
    make_decision_node,
    should_continue_after_availability,
    should_continue_after_fatigue
)
import logging

logger = logging.getLogger(__name__)


def create_validation_workflow() -> StateGraph:
    logger.info("Building validation workflow graph...")

    workflow = StateGraph(SwapValidationState)
    workflow.add_node("load_context", load_context_node)
    workflow.add_node("check_availability", check_availability_node)
    workflow.add_node("check_fatigue", check_fatigue_node)
    workflow.add_node("check_staffing", check_staffing_node)
    workflow.add_node("check_compliance", check_compliance_node)
    workflow.add_node("make_decision", make_decision_node)
    workflow.set_entry_point("load_context")
    workflow.add_edge("load_context", "check_availability")
    workflow.add_conditional_edges(
        "check_availability",
        should_continue_after_availability,
        {
            "check_fatigue": "check_fatigue",
            "make_decision": "make_decision"
        }
    )
    workflow.add_conditional_edges(
        "check_fatigue",
        should_continue_after_fatigue,
        {
            "check_staffing": "check_staffing",
            "make_decision": "make_decision"
        }
    )
    workflow.add_edge("check_staffing", "check_compliance")
    workflow.add_edge("check_compliance", "make_decision")
    workflow.add_edge("make_decision", END)
    
    logger.info("Workflow graph compiled successfully")
    return workflow.compile()


validation_app = create_validation_workflow()
