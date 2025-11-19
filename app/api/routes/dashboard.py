from fastapi import APIRouter

router = APIRouter()


@router.get("/overview")
def get_dashboard_overview() -> dict:
    """Return dashboard metrics and latest upload batches."""

    return {
        "stats": {
            "registeredMetrics": {"total": 128, "sensitive": 34},
            "activeVersions": {"total": 52, "releasedThisWeek": 3},
            "yesterdayJobs": {"total": 86, "failed": 2},
            "recentUploads": {"total": 5, "processing": 1},
        },
        "taskSummary": {
            "title": "近7天任务执行概览",
            "description": "这里可用于折线/柱状图展示每日成功/失败任务数、平均耗时等。",
        },
        "uploads": [
            {"batchId": "B20250101", "source": "手工上传", "filename": "gmv_2024Q4.csv", "status": "已完成"},
            {"batchId": "B20250102", "source": "API", "filename": "user_growth.json", "status": "排队中"},
        ],
    }
