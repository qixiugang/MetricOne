# MetricOne 指标管理系统（后端骨架）

该仓库提供与原型页面配套的 FastAPI 后端骨架，覆盖指标目录、数据治理、任务执行、权限与观测性等核心域。整体技术栈：FastAPI + SQLAlchemy 2 + Alembic、Celery/Redis、Airflow、MinIO、Lark DSL、Pandas/PyArrow、MySQL/Spark、OAuth2+JWT、Python Logging + ELK、Prometheus+Grafana、Pydantic Settings。

## 目录结构

```
app/
  core/         # 配置、日志、安全、celery
  api/          # 路由定义
  services/     # 业务逻辑
  models/       # SQLAlchemy 模型
  schemas/      # Pydantic Schema
  workers/      # Celery 任务
  dsl/          # DSL 语法与解析器
  pipelines/    # Airflow 适配
  utils/        # MinIO 等工具
metric-prototype.html  # 参考原型
```

## 快速开始

1. 安装依赖（Poetry/uv/pip 均可）。
2. 设置环境变量或 `.env`，示例见 `app/core/config.py`。
3. `uvicorn app.main:app --reload` 启动 API，`celery -A app.core.celery_app.celery_app worker -l info` 启动任务。
4. 使用 `scripts/seed_data.py`（待实现）导入示例指标。

## 下一步

- 丰富模型字段并补齐 Alembic 迁移
- 实现 DSL 编译与 SQL/Spark 适配
- 与前端原型联调
- 加入 CI/CD、监控与日志采集脚本
