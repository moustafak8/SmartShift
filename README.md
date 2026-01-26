<img src="./readme/cards/title1.svg"/>

<br><br>

## License

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

<br><br>

<!-- project overview -->
<img src="./readme/cards/title2.svg"/>

> **SmartShift** is an intelligent scheduling and wellness management platform tailored for the healthcare, hospitality, and dynamic shift sectors across the MENA region.
>
> **Problem:** Irregular shift work causes employee burnout, fatigue, and high turnover. Managers lack tools to proactively identify at-risk staff, leading to decreased service quality and increased operational costs.
>
> **Solution:** An AI-powered scheduling system that balances operational needs with employee well-being through:
>
> - **Automated scheduling** with burnout prevention rules.
> - **Real-time fatigue scoring** (0-100 scale with risk levels).
> - **RAG-powered wellness journal** with natural language AI parsing.
> - **Intelligent shift swap validation** using decision-tree logic.
> - **Predictive analytics** for burnout trends and staffing insights.

<br><br>

<!-- System Design -->
<img src="./readme/cards/title3.svg"/>

### System Design

<a href="./readme/design/System.png">
  <img src="./readme/design/System.png" alt="System Design" width="1200">
</a>


### Entity Relationship Diagram

[ER Diagram](https://dbdiagram.io/d/SmartShift-6950f70939fa3db27ba940fc)

<img src="./readme/design/erd.png"/>
<br><br>

<!-- Project Highlights -->
<img src="./readme/cards/title4.svg"/>

### Interesting Features

> #### Intelligent Shift Swap Agent
> AI-driven validation using decision-tree logic. It evaluates availability and simulates fatigue impact for both parties, auto-approving safe exchanges while blocking those that risk employee burnout.
> 
> #### RAG-Powered Wellness Journal
> High-fidelity analysis of employee journals using GPT-4 and Qdrant vector storage. Enables semantic search, allowing managers to query concerns naturally and identify recurring wellness patterns.
> 
> ####  Auto-Scheduler
> Advanced algorithmic generation of weekly schedules that balances operational coverage, availability, and fatigue risks. Managers can review real-time metrics to approve, reject, or fine-tune assignments.
> 
> #### Real-Time Burnout Prediction
> A holistic fatigue scoring system (Quantitative, Qualitative, Psychological) that updates dynamically. It proactively flags critical cases and prevents high-risk scheduling before exhaustion occurs.

### Feature Figure
<img src="./readme/features/Features.png"/>


<br><br>
<!-- Demo -->
<img src="./readme/cards/title5.svg"/>

### Manager Screens

<table width="100%">
  <colgroup>
    <col width="35%">
    <col width="65%">
  </colgroup>
  <tr>
    <th>Login</th>
    <th>Manager Dashboard</th>
  </tr>
  <tr>
    <td>
      <a href="./readme/demo/login.png">
        <img src="./readme/demo/login.png" alt="Login" height="340">
      </a>
    </td>
    <td>
      <a href="./readme/demo/manager_dashboard.png">
        <img src="./readme/demo/manager_dashboard.png" alt="Manager Dashboard" height="340">
      </a>
    </td>
  </tr>
  <tr>
    <th colspan="2">Shift Creation</th>
  </tr>
  <tr>
    <td colspan="2" align="center">
      <a href="./readme/demo/shift_creation.gif">
        <img src="./readme/demo/shift_creation.gif" alt="Shift Creation" height="420">
      </a>
    </td>
  </tr>
</table>

<br>

<table>
  <tr>
    <th>Add Employee</th>
    <th>Team Management</th>
  </tr>
  <tr>
    <td>
      <a href="./readme/demo/add_employee.png">
        <img src="./readme/demo/add_employee.png" alt="Add Employee" height="420">
      </a>
    </td>
    <td>
      <a href="./readme/demo/team_overview.png">
        <img src="./readme/demo/team_overview.png" alt="Team Management" height="420">
      </a>
    </td>
  </tr>
  <tr>
    <th colspan="2">Schedule Generation</th>
  </tr>
  <tr>
    <td colspan="2" align="center">
      <a href="./readme/demo/schedule_generation.gif">
        <img src="./readme/demo/schedule_generation.gif" alt="Schedule Generation" height="420">
      </a>
    </td>
  </tr>
</table>

<br>

<table>
  <tr>
    <th>Reports</th>
    <th>Insights</th>
  </tr>
  <tr>
    <td>
      <a href="./readme/demo/reports.png">
        <img src="./readme/demo/reports.png" alt="Reports" height="340">
      </a>
    </td>
    <td>
      <a href="./readme/demo/insights.png">
        <img src="./readme/demo/insights.png" alt="Insights" height="340">
      </a>
    </td>
  </tr>
  <tr>
    <th colspan="2">RAG Search</th>
  </tr>
  <tr>
    <td colspan="2" align="center">
      <a href="./readme/demo/Rag_search.gif">
        <img src="./readme/demo/Rag_search.gif" alt="RAG Search" height="340">
      </a>
    </td>
  </tr>
</table>

<br>

<table>
  <tr>
    <th>Manager Swap</th>
  </tr>
  <tr>
    <td  align="center">
      <a href="./readme/demo/manager_swap.png">
        <img src="./readme/demo/manager_swap.png" alt="Manager Swap" width="1200">
      </a>
    </td>
  </tr>
</table>

<br>

### Employee Screens

<table>
  <tr>
    <th>Employee Dashboard</th>
    <th>Preferences</th>
  </tr>
  <tr>
    <td>
      <a href="./readme/demo/emp_dashboard.png">
        <img src="./readme/demo/emp_dashboard.png" alt="Employee Dashboard" height="360">
      </a>
    </td>
    <td>
      <a href="./readme/demo/emp_prefrence.gif">
        <img src="./readme/demo/emp_prefrence.gif" alt="Employee Preferences" height="360">
      </a>
    </td>
  </tr>
  <tr>
    <th>Schedule</th>
    <th>Score Breakdown</th>
  </tr>
  <tr>
    <td>
      <a href="./readme/demo/emp_schedule.png">
        <img src="./readme/demo/emp_schedule.png" alt="Employee Schedule" height="360">
      </a>
    </td>
    <td>
      <a href="./readme/demo/score_breakdown.png">
        <img src="./readme/demo/score_breakdown.png" alt="Score Breakdown" height="360">
      </a>
    </td>
  </tr>
  <tr>
    <th>Notifications</th>
    <th>Entry Submission</th>
  </tr>
  <tr>
    <td>
      <a href="./readme/demo/notification.png">
        <img src="./readme/demo/notification.png" alt="Notifications" height="360">
      </a>
    </td>
    <td>
      <a href="./readme/demo/entry_submission.gif">
        <img src="./readme/demo/entry_submission.gif" alt="Entry Submission" height="360">
      </a>
    </td>
  </tr>
  <tr>
    <th colspan="2">Swap</th>
  </tr>
  <tr>
    <td colspan="2" align="center">
      <a href="./readme/demo/swap.gif">
        <img src="./readme/demo/swap.gif" alt="Swap" height="360">
      </a>
    </td>
  </tr>
</table>


<br><br>
<!-- Development & Testing -->
<img src="./readme/cards/title6.svg"/>

### Development

<table width="100%">
  <tr>
    <th>Services</th>
    <th>Validation</th>
    <th>Controller</th>
  </tr>
  <tr>
    <td>
      <a href="./readme/development/Service_ex.png">
        <img src="./readme/development/Service_ex.png" alt="Service Example" height="400">
      </a>
    </td>
    <td>
      <a href="./readme/development/Validation_ex.png">
        <img src="./readme/development/Validation_ex.png" alt="Validation Example" height="400">
      </a>
    </td>
    <td>
      <a href="./readme/development/Controller_ex.png">
        <img src="./readme/development/Controller_ex.png" alt="Controller Example" height="400">
      </a>
    </td>
  </tr>
</table>

<br>
### SmartShift AI Agent

> ####  Autonomous Shift Validation Engine
> An advanced decision-making system powered by **FastAPI** and **LangGraph** that orchestrates a multi-stage evaluation pipeline. Unlike traditional rule engines, the SmartShift Agent leverages **GPT-4o reasoning** to analyze complex factors—including **Availability**, **Projected Fatigue**, **Staffing Levels**, and **Labor Compliance**—ensuring every swap is safe and operationally optimal.

<br>

<a href="./readme/agent/Agent_flow.png">
  <img src="./readme/agent/Agent_flow.png" alt="Agent Flow" width="1200">
</a>

### Tests

<table width="100%">
  <tr>
    <th>CI/CD</th>
  </tr>
  <tr>
    <td align="center">
      <a href="./readme/tests/CICD.png">
        <img src="./readme/tests/CICD.png" alt="CI/CD" width="1200">
      </a>
    </td>
  </tr>
  <tr>
    <th>Testing</th>
  </tr>
  <tr>
    <td align="center">
      <a href="./readme/tests/test_cases.png">
        <img src="./readme/tests/test_cases.png" alt="Testing" width="1200">
      </a>
    </td>
  </tr>
</table>


<br><br>
<!-- Deployment -->
<img src="./readme/cards/title7.svg"/>

### Deployment Map

| Deployment Map                          |
| --------------------------------------- |
| ![Map](./readme/tests/Deploymentmap.jpg) |