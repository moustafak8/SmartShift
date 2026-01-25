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

<img src="./readme/design/system.png"/>


### Entity Relationship Diagram

[ER Diagram](https://dbdiagram.io/d/SmartShift-6950f70939fa3db27ba940fc)

<img src="./readme/design/SmartShift (2).png"/>
<br><br>

<!-- Project Highlights -->
<img src="./readme/cards/title4.svg"/>

### Interesting Features

> #### 🛡️ Intelligent Shift Swap Agent
> AI-driven validation using decision-tree logic. It evaluates availability and simulates fatigue impact for both parties, auto-approving safe exchanges while blocking those that risk employee burnout.
> 
> #### 🧠 RAG-Powered Wellness Journal
> High-fidelity analysis of employee journals using GPT-4 and Qdrant vector storage. Enables semantic search, allowing managers to query concerns naturally and identify recurring wellness patterns.
> 
> #### 📅  Auto-Scheduler
> Advanced algorithmic generation of weekly schedules that balances operational coverage, availability, and fatigue risks. Managers can review real-time metrics to approve, reject, or fine-tune assignments.
> 

> #### 📉 Real-Time Burnout Prediction
> A holistic fatigue scoring system (Quantitative, Qualitative, Psychological) that updates dynamically. It proactively flags critical cases and prevents high-risk scheduling before exhaustion occurs.


<img src="./readme/features/Features.png"/>


<br><br>
<!-- Demo -->
<img src="./readme/cards/title5.svg"/>

### User Screens

<table>
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
    <th colspan="2">Team Management</th>
  </tr>
  <tr>
    <td colspan="2" align="center">
      <a href="./readme/demo/team_overview.png">
        <img src="./readme/demo/team_overview.png" alt="Team Management" height="340">
      </a>
    </td>
  </tr>
</table>


<br><br>
<!-- Development & Testing -->
<img src="./readme/cards/title6.svg"/>

### SmartShift AI Agent

> ####  Autonomous Shift Validation Engine
> An advanced decision-making system powered by **FastAPI** and **LangGraph** that orchestrates a multi-stage evaluation pipeline. Unlike traditional rule engines, the SmartShift Agent leverages **GPT-4o reasoning** to analyze complex factors—including **Availability**, **Projected Fatigue**, **Staffing Levels**, and **Labor Compliance**—ensuring every swap is safe and operationally optimal.

<br>

<img src="./readme/agent/Agent_Flow.png"/>

### Tests


| CI/CD                             | Testing                        |
| ---------------------------------------  | ------------------------------------- |
| ![CICD](./readme/tests/CICD.png) | ![Testing](./readme/tests/test_cases.png) |


<br><br>
