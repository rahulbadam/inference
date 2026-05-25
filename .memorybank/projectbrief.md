# Project Brief: AI Inference Lab

## Overview
AI Inference Lab is a modern, production-grade interactive dashboard for learning and simulating AI inference concepts. It allows users to experiment with different configurations (model, hardware, engine) and instantly see calculated impact on performance, cost, and bottlenecks.

## Core Purpose
Educational + simulation platform that teaches AI infrastructure engineers how inference works by letting them manipulate variables and observe outcomes in real-time.

## Target Audience
- AI/ML engineers learning inference optimization
- Infrastructure teams evaluating deployment strategies
- Students studying transformer architecture and serving
- Practitioners comparing quantization and hardware options

## Key Value Propositions
1. **Learn by doing** — Change parameters and watch metrics update live
2. **Realistic physics** — Formulas mirror real-world inference behavior
3. **Visual teaching** — Charts, animations, and architecture diagrams explain concepts
4. **Decision support** — Cost estimates, bottleneck detection, deployment recommendations

## Success Criteria
- Users can configure any combination of model/hardware/engine
- Metrics update instantly (<100ms) on configuration changes
- Educational tooltips explain every technical term
- Bottleneck analyzer identifies problems AND shows root causes
- Comparisons can be saved and contrasted side-by-side

## Scope
### In Scope
- Single-page interactive dashboard with 13+ modules
- Simulation engine with realistic formulas
- Dark-themed NVIDIA/Datadog-inspired UI
- localStorage persistence for user preferences
- 6 scenario presets (ChatGPT scale, RTX 4090 local, edge, enterprise, mobile, low-latency)
- 50+ AI inference tooltips with formulas and examples

### Out of Scope
- Actual LLM inference (this is simulation only)
- Backend API or database
- User authentication
- Real-time data streaming from GPUs
- Deployment automation

## Project Status
Production-ready MVP. Built and functional. Deployed via Vercel.