window.RK3568_VAULT_DATA = {
  "currentStage": "05",
  "currentTasks": [
    {
      "completed": false,
      "text": "完成 [[02-源码陪读/05-V4L2-Subdev/01-生命周期|驱动注册与 Subdev 组装]] 第一轮问答"
    },
    {
      "completed": false,
      "text": "指出 `imx415_i2c_driver`、`imx415_subdev_ops`、`imx415_ctrl_ops` 分别交给哪个框架"
    },
    {
      "completed": false,
      "text": "从 `v4l2_i2c_subdev_init()` 追到 `sd->ops = ops`，并说明挂接函数表不等于执行函数"
    },
    {
      "completed": false,
      "text": "从用户态 `STREAMON` 口述到 `imx415_s_stream()` 与 `__imx415_start_stream()`"
    }
  ],
  "stages": [],
  "domains": [
    {
      "name": "Camera",
      "filePath": "07-专项笔记/Camera-V4L2/IMX415驱动调试与最小demo路线.md",
      "url": "obsidian://open?vault=RK3568&file=07-%E4%B8%93%E9%A1%B9%E7%AC%94%E8%AE%B0%2FCamera-V4L2%2FIMX415%E9%A9%B1%E5%8A%A8%E8%B0%83%E8%AF%95%E4%B8%8E%E6%9C%80%E5%B0%8Fdemo%E8%B7%AF%E7%BA%BF",
      "webPath": "pages/notes/07-专项笔记--Camera-V4L2--IMX415驱动调试与最小demo路线.html"
    },
    {
      "name": "V4L2",
      "filePath": "07-专项笔记/Camera-V4L2/V4L2命令行抓帧记录.md",
      "url": "obsidian://open?vault=RK3568&file=07-%E4%B8%93%E9%A1%B9%E7%AC%94%E8%AE%B0%2FCamera-V4L2%2FV4L2%E5%91%BD%E4%BB%A4%E8%A1%8C%E6%8A%93%E5%B8%A7%E8%AE%B0%E5%BD%95",
      "webPath": "pages/notes/07-专项笔记--Camera-V4L2--V4L2命令行抓帧记录.html"
    },
    {
      "name": "OpenCV",
      "filePath": "07-专项笔记/OpenCV/OpenCV读取Camera记录.md",
      "url": "obsidian://open?vault=RK3568&file=07-%E4%B8%93%E9%A1%B9%E7%AC%94%E8%AE%B0%2FOpenCV%2FOpenCV%E8%AF%BB%E5%8F%96Camera%E8%AE%B0%E5%BD%95",
      "webPath": "pages/notes/07-专项笔记--OpenCV--OpenCV读取Camera记录.html"
    },
    {
      "name": "System",
      "filePath": "07-专项笔记/系统/AI Camera系统数据流与模块边界.md",
      "url": "obsidian://open?vault=RK3568&file=07-%E4%B8%93%E9%A1%B9%E7%AC%94%E8%AE%B0%2F%E7%B3%BB%E7%BB%9F%2FAI%20Camera%E7%B3%BB%E7%BB%9F%E6%95%B0%E6%8D%AE%E6%B5%81%E4%B8%8E%E6%A8%A1%E5%9D%97%E8%BE%B9%E7%95%8C",
      "webPath": "pages/notes/07-专项笔记--系统--AI Camera系统数据流与模块边界.html"
    }
  ],
  "evidence": [
    {
      "id": "EVID-20260728-CAMERA-DAY1",
      "name": "Camera 驱动 Day 1 板端验收",
      "type": "record",
      "mediaType": "text/markdown",
      "assetPath": "",
      "vaultPath": "",
      "attachments": [],
      "sourcePath": "05-实验与证据/2026-07-28-Camera驱动Day1验收.md",
      "sourceUrl": "obsidian://open?vault=RK3568&file=05-%E5%AE%9E%E9%AA%8C%E4%B8%8E%E8%AF%81%E6%8D%AE%2F2026-07-28-Camera%E9%A9%B1%E5%8A%A8Day1%E9%AA%8C%E6%94%B6",
      "stageLabel": "阶段 4",
      "evidenceStageKey": "stage-4",
      "status": "verified",
      "environment": {
        "collectedAt": "2026-07-28 (具体时分未记录)",
        "board": "ATK-DLRK3568 + IMX415",
        "system": "Buildroot (release string 未保留)",
        "kernel": "4.19.232",
        "sdkCommit": "未记录",
        "dtb": "运行中 DTB 文件名与哈希未记录",
        "deviceIp": "192.168.0.230",
        "rawOutputFile": "无独立原始文件；关键输出摘录保存在本文"
      }
    },
    {
      "id": "EVID-20260728-IMX415-RUNTIME",
      "name": "直连板端读取 IMX415 运行时配置",
      "type": "record",
      "mediaType": "text/markdown",
      "assetPath": "",
      "vaultPath": "",
      "attachments": [],
      "sourcePath": "05-实验与证据/2026-07-28-直连板端读取IMX415配置.md",
      "sourceUrl": "obsidian://open?vault=RK3568&file=05-%E5%AE%9E%E9%AA%8C%E4%B8%8E%E8%AF%81%E6%8D%AE%2F2026-07-28-%E7%9B%B4%E8%BF%9E%E6%9D%BF%E7%AB%AF%E8%AF%BB%E5%8F%96IMX415%E9%85%8D%E7%BD%AE",
      "stageLabel": "阶段 2",
      "evidenceStageKey": "stage-2",
      "status": "verified",
      "environment": {
        "collectedAt": "2026-07-28 (具体时分未记录)",
        "board": "ATK-DLRK3568 + IMX415",
        "system": "Buildroot (release string 未保留)",
        "kernel": "4.19.232",
        "sdkCommit": "未记录",
        "dtb": "运行中 DTB 文件名与哈希未记录",
        "deviceIp": "192.168.0.230",
        "rawOutputFile": "无独立原始文件；关键输出摘录保存在本文"
      }
    }
  ],
  "quickLinks": [
    {
      "name": "taskBoard",
      "filePath": "06-任务/01-下一步任务看板.md",
      "url": "obsidian://open?vault=RK3568&file=06-%E4%BB%BB%E5%8A%A1%2F01-%E4%B8%8B%E4%B8%80%E6%AD%A5%E4%BB%BB%E5%8A%A1%E7%9C%8B%E6%9D%BF",
      "webPath": "pages/notes/06-任务--01-下一步任务看板.html"
    },
    {
      "name": "activeRoute",
      "filePath": "06-任务/Camera驱动求职第1周执行计划.md",
      "url": "obsidian://open?vault=RK3568&file=06-%E4%BB%BB%E5%8A%A1%2FCamera%E9%A9%B1%E5%8A%A8%E6%B1%82%E8%81%8C%E7%AC%AC1%E5%91%A8%E6%89%A7%E8%A1%8C%E8%AE%A1%E5%88%92",
      "webPath": "pages/notes/06-任务--Camera驱动求职第1周执行计划.html"
    },
    {
      "name": "currentChapter",
      "filePath": "01-课程主线/03-IMX415-Sensor-Bring-up.md",
      "url": "obsidian://open?vault=RK3568&file=01-%E8%AF%BE%E7%A8%8B%E4%B8%BB%E7%BA%BF%2F03-IMX415-Sensor-Bring-up",
      "webPath": "pages/notes/01-课程主线--03-IMX415-Sensor-Bring-up.html"
    },
    {
      "name": "dailyRecord",
      "filePath": "05-实验与证据/2026-07-28-Camera驱动Day1验收.md",
      "url": "obsidian://open?vault=RK3568&file=05-%E5%AE%9E%E9%AA%8C%E4%B8%8E%E8%AF%81%E6%8D%AE%2F2026-07-28-Camera%E9%A9%B1%E5%8A%A8Day1%E9%AA%8C%E6%94%B6",
      "webPath": "pages/notes/05-实验与证据--2026-07-28-Camera驱动Day1验收.html"
    },
    {
      "name": "acceptance",
      "filePath": "07-专项笔记/系统/Camera驱动能力验收矩阵.md",
      "url": "obsidian://open?vault=RK3568&file=07-%E4%B8%93%E9%A1%B9%E7%AC%94%E8%AE%B0%2F%E7%B3%BB%E7%BB%9F%2FCamera%E9%A9%B1%E5%8A%A8%E8%83%BD%E5%8A%9B%E9%AA%8C%E6%94%B6%E7%9F%A9%E9%98%B5",
      "webPath": "pages/notes/07-专项笔记--系统--Camera驱动能力验收矩阵.html"
    },
    {
      "name": "evidenceMoc",
      "filePath": "05-实验与证据/2026-07-28-直连板端读取IMX415配置.md",
      "url": "obsidian://open?vault=RK3568&file=05-%E5%AE%9E%E9%AA%8C%E4%B8%8E%E8%AF%81%E6%8D%AE%2F2026-07-28-%E7%9B%B4%E8%BF%9E%E6%9D%BF%E7%AB%AF%E8%AF%BB%E5%8F%96IMX415%E9%85%8D%E7%BD%AE",
      "webPath": "pages/notes/05-实验与证据--2026-07-28-直连板端读取IMX415配置.html"
    },
    {
      "name": "outputMoc",
      "filePath": "09-输出沉淀/00-输出沉淀入口.md",
      "url": "obsidian://open?vault=RK3568&file=09-%E8%BE%93%E5%87%BA%E6%B2%89%E6%B7%80%2F00-%E8%BE%93%E5%87%BA%E6%B2%89%E6%B7%80%E5%85%A5%E5%8F%A3",
      "webPath": "pages/notes/09-输出沉淀--00-输出沉淀入口.html"
    }
  ],
  "notes": [
    {
      "title": "00-系统总览",
      "folder": "01-课程主线",
      "filePath": "01-课程主线/00-系统总览.md",
      "webPath": "pages/notes/01-课程主线--00-系统总览.html",
      "url": "obsidian://open?vault=RK3568&file=01-%E8%AF%BE%E7%A8%8B%E4%B8%BB%E7%BA%BF%2F00-%E7%B3%BB%E7%BB%9F%E6%80%BB%E8%A7%88"
    },
    {
      "title": "01-Linux-Driver-Model",
      "folder": "01-课程主线",
      "filePath": "01-课程主线/01-Linux-Driver-Model.md",
      "webPath": "pages/notes/01-课程主线--01-Linux-Driver-Model.html",
      "url": "obsidian://open?vault=RK3568&file=01-%E8%AF%BE%E7%A8%8B%E4%B8%BB%E7%BA%BF%2F01-Linux-Driver-Model"
    },
    {
      "title": "02-DTS与设备发现",
      "folder": "01-课程主线",
      "filePath": "01-课程主线/02-DTS与设备发现.md",
      "webPath": "pages/notes/01-课程主线--02-DTS与设备发现.html",
      "url": "obsidian://open?vault=RK3568&file=01-%E8%AF%BE%E7%A8%8B%E4%B8%BB%E7%BA%BF%2F02-DTS%E4%B8%8E%E8%AE%BE%E5%A4%87%E5%8F%91%E7%8E%B0"
    },
    {
      "title": "03-IMX415-Sensor-Bring-up",
      "folder": "01-课程主线",
      "filePath": "01-课程主线/03-IMX415-Sensor-Bring-up.md",
      "webPath": "pages/notes/01-课程主线--03-IMX415-Sensor-Bring-up.html",
      "url": "obsidian://open?vault=RK3568&file=01-%E8%AF%BE%E7%A8%8B%E4%B8%BB%E7%BA%BF%2F03-IMX415-Sensor-Bring-up"
    },
    {
      "title": "04-MIPI-CSI2-DPHY",
      "folder": "01-课程主线",
      "filePath": "01-课程主线/04-MIPI-CSI2-DPHY.md",
      "webPath": "pages/notes/01-课程主线--04-MIPI-CSI2-DPHY.html",
      "url": "obsidian://open?vault=RK3568&file=01-%E8%AF%BE%E7%A8%8B%E4%B8%BB%E7%BA%BF%2F04-MIPI-CSI2-DPHY"
    },
    {
      "title": "05-V4L2-Subdev",
      "folder": "01-课程主线",
      "filePath": "01-课程主线/05-V4L2-Subdev.md",
      "webPath": "pages/notes/01-课程主线--05-V4L2-Subdev.html",
      "url": "obsidian://open?vault=RK3568&file=01-%E8%AF%BE%E7%A8%8B%E4%B8%BB%E7%BA%BF%2F05-V4L2-Subdev"
    },
    {
      "title": "06-Media-Controller",
      "folder": "01-课程主线",
      "filePath": "01-课程主线/06-Media-Controller.md",
      "webPath": "pages/notes/01-课程主线--06-Media-Controller.html",
      "url": "obsidian://open?vault=RK3568&file=01-%E8%AF%BE%E7%A8%8B%E4%B8%BB%E7%BA%BF%2F06-Media-Controller"
    },
    {
      "title": "07-RKISP",
      "folder": "01-课程主线",
      "filePath": "01-课程主线/07-RKISP.md",
      "webPath": "pages/notes/01-课程主线--07-RKISP.html",
      "url": "obsidian://open?vault=RK3568&file=01-%E8%AF%BE%E7%A8%8B%E4%B8%BB%E7%BA%BF%2F07-RKISP"
    },
    {
      "title": "08-V4L2用户态取流",
      "folder": "01-课程主线",
      "filePath": "01-课程主线/08-V4L2用户态取流.md",
      "webPath": "pages/notes/01-课程主线--08-V4L2用户态取流.html",
      "url": "obsidian://open?vault=RK3568&file=01-%E8%AF%BE%E7%A8%8B%E4%B8%BB%E7%BA%BF%2F08-V4L2%E7%94%A8%E6%88%B7%E6%80%81%E5%8F%96%E6%B5%81"
    },
    {
      "title": "09-GStreamer-OpenCV",
      "folder": "01-课程主线",
      "filePath": "01-课程主线/09-GStreamer-OpenCV.md",
      "webPath": "pages/notes/01-课程主线--09-GStreamer-OpenCV.html",
      "url": "obsidian://open?vault=RK3568&file=01-%E8%AF%BE%E7%A8%8B%E4%B8%BB%E7%BA%BF%2F09-GStreamer-OpenCV"
    },
    {
      "title": "10-RKNN-YOLO",
      "folder": "01-课程主线",
      "filePath": "01-课程主线/10-RKNN-YOLO.md",
      "webPath": "pages/notes/01-课程主线--10-RKNN-YOLO.html",
      "url": "obsidian://open?vault=RK3568&file=01-%E8%AF%BE%E7%A8%8B%E4%B8%BB%E7%BA%BF%2F10-RKNN-YOLO"
    },
    {
      "title": "11-Camera-Bring-up排障",
      "folder": "01-课程主线",
      "filePath": "01-课程主线/11-Camera-Bring-up排障.md",
      "webPath": "pages/notes/01-课程主线--11-Camera-Bring-up排障.html",
      "url": "obsidian://open?vault=RK3568&file=01-%E8%AF%BE%E7%A8%8B%E4%B8%BB%E7%BA%BF%2F11-Camera-Bring-up%E6%8E%92%E9%9A%9C"
    },
    {
      "title": "00-Camera证据索引",
      "folder": "05-实验与证据",
      "filePath": "05-实验与证据/00-Camera证据索引.md",
      "webPath": "pages/notes/05-实验与证据--00-Camera证据索引.html",
      "url": "obsidian://open?vault=RK3568&file=05-%E5%AE%9E%E9%AA%8C%E4%B8%8E%E8%AF%81%E6%8D%AE%2F00-Camera%E8%AF%81%E6%8D%AE%E7%B4%A2%E5%BC%95"
    },
    {
      "title": "2026-07-28-Camera驱动Day1验收",
      "folder": "05-实验与证据",
      "filePath": "05-实验与证据/2026-07-28-Camera驱动Day1验收.md",
      "webPath": "pages/notes/05-实验与证据--2026-07-28-Camera驱动Day1验收.html",
      "url": "obsidian://open?vault=RK3568&file=05-%E5%AE%9E%E9%AA%8C%E4%B8%8E%E8%AF%81%E6%8D%AE%2F2026-07-28-Camera%E9%A9%B1%E5%8A%A8Day1%E9%AA%8C%E6%94%B6"
    },
    {
      "title": "2026-07-28-直连板端读取IMX415配置",
      "folder": "05-实验与证据",
      "filePath": "05-实验与证据/2026-07-28-直连板端读取IMX415配置.md",
      "webPath": "pages/notes/05-实验与证据--2026-07-28-直连板端读取IMX415配置.html",
      "url": "obsidian://open?vault=RK3568&file=05-%E5%AE%9E%E9%AA%8C%E4%B8%8E%E8%AF%81%E6%8D%AE%2F2026-07-28-%E7%9B%B4%E8%BF%9E%E6%9D%BF%E7%AB%AF%E8%AF%BB%E5%8F%96IMX415%E9%85%8D%E7%BD%AE"
    },
    {
      "title": "manifest",
      "folder": "05-实验与证据/assets",
      "filePath": "05-实验与证据/assets/manifest.md",
      "webPath": "pages/notes/05-实验与证据--assets--manifest.html",
      "url": "obsidian://open?vault=RK3568&file=05-%E5%AE%9E%E9%AA%8C%E4%B8%8E%E8%AF%81%E6%8D%AE%2Fassets%2Fmanifest"
    },
    {
      "title": "RK3568-IMX415当前基线",
      "folder": "05-实验与证据/环境基线",
      "filePath": "05-实验与证据/环境基线/RK3568-IMX415当前基线.md",
      "webPath": "pages/notes/05-实验与证据--环境基线--RK3568-IMX415当前基线.html",
      "url": "obsidian://open?vault=RK3568&file=05-%E5%AE%9E%E9%AA%8C%E4%B8%8E%E8%AF%81%E6%8D%AE%2F%E7%8E%AF%E5%A2%83%E5%9F%BA%E7%BA%BF%2FRK3568-IMX415%E5%BD%93%E5%89%8D%E5%9F%BA%E7%BA%BF"
    },
    {
      "title": "01-下一步任务看板",
      "folder": "06-任务",
      "filePath": "06-任务/01-下一步任务看板.md",
      "webPath": "pages/notes/06-任务--01-下一步任务看板.html",
      "url": "obsidian://open?vault=RK3568&file=06-%E4%BB%BB%E5%8A%A1%2F01-%E4%B8%8B%E4%B8%80%E6%AD%A5%E4%BB%BB%E5%8A%A1%E7%9C%8B%E6%9D%BF"
    },
    {
      "title": "Camera驱动求职第1周执行计划",
      "folder": "06-任务",
      "filePath": "06-任务/Camera驱动求职第1周执行计划.md",
      "webPath": "pages/notes/06-任务--Camera驱动求职第1周执行计划.html",
      "url": "obsidian://open?vault=RK3568&file=06-%E4%BB%BB%E5%8A%A1%2FCamera%E9%A9%B1%E5%8A%A8%E6%B1%82%E8%81%8C%E7%AC%AC1%E5%91%A8%E6%89%A7%E8%A1%8C%E8%AE%A1%E5%88%92"
    },
    {
      "title": "00-专项笔记入口",
      "folder": "07-专项笔记",
      "filePath": "07-专项笔记/00-专项笔记入口.md",
      "webPath": "pages/notes/07-专项笔记--00-专项笔记入口.html",
      "url": "obsidian://open?vault=RK3568&file=07-%E4%B8%93%E9%A1%B9%E7%AC%94%E8%AE%B0%2F00-%E4%B8%93%E9%A1%B9%E7%AC%94%E8%AE%B0%E5%85%A5%E5%8F%A3"
    },
    {
      "title": "01-概念索引",
      "folder": "07-专项笔记",
      "filePath": "07-专项笔记/01-概念索引.md",
      "webPath": "pages/notes/07-专项笔记--01-概念索引.html",
      "url": "obsidian://open?vault=RK3568&file=07-%E4%B8%93%E9%A1%B9%E7%AC%94%E8%AE%B0%2F01-%E6%A6%82%E5%BF%B5%E7%B4%A2%E5%BC%95"
    },
    {
      "title": "IMX415驱动调试与最小demo路线",
      "folder": "07-专项笔记/Camera-V4L2",
      "filePath": "07-专项笔记/Camera-V4L2/IMX415驱动调试与最小demo路线.md",
      "webPath": "pages/notes/07-专项笔记--Camera-V4L2--IMX415驱动调试与最小demo路线.html",
      "url": "obsidian://open?vault=RK3568&file=07-%E4%B8%93%E9%A1%B9%E7%AC%94%E8%AE%B0%2FCamera-V4L2%2FIMX415%E9%A9%B1%E5%8A%A8%E8%B0%83%E8%AF%95%E4%B8%8E%E6%9C%80%E5%B0%8Fdemo%E8%B7%AF%E7%BA%BF"
    },
    {
      "title": "V4L2命令行抓帧记录",
      "folder": "07-专项笔记/Camera-V4L2",
      "filePath": "07-专项笔记/Camera-V4L2/V4L2命令行抓帧记录.md",
      "webPath": "pages/notes/07-专项笔记--Camera-V4L2--V4L2命令行抓帧记录.html",
      "url": "obsidian://open?vault=RK3568&file=07-%E4%B8%93%E9%A1%B9%E7%AC%94%E8%AE%B0%2FCamera-V4L2%2FV4L2%E5%91%BD%E4%BB%A4%E8%A1%8C%E6%8A%93%E5%B8%A7%E8%AE%B0%E5%BD%95"
    },
    {
      "title": "OpenCV读取Camera记录",
      "folder": "07-专项笔记/OpenCV",
      "filePath": "07-专项笔记/OpenCV/OpenCV读取Camera记录.md",
      "webPath": "pages/notes/07-专项笔记--OpenCV--OpenCV读取Camera记录.html",
      "url": "obsidian://open?vault=RK3568&file=07-%E4%B8%93%E9%A1%B9%E7%AC%94%E8%AE%B0%2FOpenCV%2FOpenCV%E8%AF%BB%E5%8F%96Camera%E8%AE%B0%E5%BD%95"
    },
    {
      "title": "AI Camera故障排查索引",
      "folder": "07-专项笔记/系统",
      "filePath": "07-专项笔记/系统/AI Camera故障排查索引.md",
      "webPath": "pages/notes/07-专项笔记--系统--AI Camera故障排查索引.html",
      "url": "obsidian://open?vault=RK3568&file=07-%E4%B8%93%E9%A1%B9%E7%AC%94%E8%AE%B0%2F%E7%B3%BB%E7%BB%9F%2FAI%20Camera%E6%95%85%E9%9A%9C%E6%8E%92%E6%9F%A5%E7%B4%A2%E5%BC%95"
    },
    {
      "title": "AI Camera系统数据流与模块边界",
      "folder": "07-专项笔记/系统",
      "filePath": "07-专项笔记/系统/AI Camera系统数据流与模块边界.md",
      "webPath": "pages/notes/07-专项笔记--系统--AI Camera系统数据流与模块边界.html",
      "url": "obsidian://open?vault=RK3568&file=07-%E4%B8%93%E9%A1%B9%E7%AC%94%E8%AE%B0%2F%E7%B3%BB%E7%BB%9F%2FAI%20Camera%E7%B3%BB%E7%BB%9F%E6%95%B0%E6%8D%AE%E6%B5%81%E4%B8%8E%E6%A8%A1%E5%9D%97%E8%BE%B9%E7%95%8C"
    },
    {
      "title": "Camera驱动能力验收矩阵",
      "folder": "07-专项笔记/系统",
      "filePath": "07-专项笔记/系统/Camera驱动能力验收矩阵.md",
      "webPath": "pages/notes/07-专项笔记--系统--Camera驱动能力验收矩阵.html",
      "url": "obsidian://open?vault=RK3568&file=07-%E4%B8%93%E9%A1%B9%E7%AC%94%E8%AE%B0%2F%E7%B3%BB%E7%BB%9F%2FCamera%E9%A9%B1%E5%8A%A8%E8%83%BD%E5%8A%9B%E9%AA%8C%E6%94%B6%E7%9F%A9%E9%98%B5"
    },
    {
      "title": "00-附录入口",
      "folder": "08-附录",
      "filePath": "08-附录/00-附录入口.md",
      "webPath": "pages/notes/08-附录--00-附录入口.html",
      "url": "obsidian://open?vault=RK3568&file=08-%E9%99%84%E5%BD%95%2F00-%E9%99%84%E5%BD%95%E5%85%A5%E5%8F%A3"
    },
    {
      "title": "SKILL",
      "folder": "08-附录/Skills/drawing-technical-flowcharts",
      "filePath": "08-附录/Skills/drawing-technical-flowcharts/SKILL.md",
      "webPath": "pages/notes/08-附录--Skills--drawing-technical-flowcharts--SKILL.html",
      "url": "obsidian://open?vault=RK3568&file=08-%E9%99%84%E5%BD%95%2FSkills%2Fdrawing-technical-flowcharts%2FSKILL"
    },
    {
      "title": "DTS基础语法",
      "folder": "08-附录/参考",
      "filePath": "08-附录/参考/DTS基础语法.md",
      "webPath": "pages/notes/08-附录--参考--DTS基础语法.html",
      "url": "obsidian://open?vault=RK3568&file=08-%E9%99%84%E5%BD%95%2F%E5%8F%82%E8%80%83%2FDTS%E5%9F%BA%E7%A1%80%E8%AF%AD%E6%B3%95"
    },
    {
      "title": "Drawing 2026-06-02 09.30.23.excalidraw",
      "folder": "08-附录/图源/Excalidraw",
      "filePath": "08-附录/图源/Excalidraw/Drawing 2026-06-02 09.30.23.excalidraw.md",
      "webPath": "pages/notes/08-附录--图源--Excalidraw--Drawing 2026-06-02 09.30.23.excalidraw.html",
      "url": "obsidian://open?vault=RK3568&file=08-%E9%99%84%E5%BD%95%2F%E5%9B%BE%E6%BA%90%2FExcalidraw%2FDrawing%202026-06-02%2009.30.23.excalidraw"
    },
    {
      "title": "Drawing 2026-06-02 09.46.25.excalidraw",
      "folder": "08-附录/图源/Excalidraw",
      "filePath": "08-附录/图源/Excalidraw/Drawing 2026-06-02 09.46.25.excalidraw.md",
      "webPath": "pages/notes/08-附录--图源--Excalidraw--Drawing 2026-06-02 09.46.25.excalidraw.html",
      "url": "obsidian://open?vault=RK3568&file=08-%E9%99%84%E5%BD%95%2F%E5%9B%BE%E6%BA%90%2FExcalidraw%2FDrawing%202026-06-02%2009.46.25.excalidraw"
    },
    {
      "title": "Drawing 2026-06-02 09.46.26.excalidraw",
      "folder": "08-附录/图源/Excalidraw",
      "filePath": "08-附录/图源/Excalidraw/Drawing 2026-06-02 09.46.26.excalidraw.md",
      "webPath": "pages/notes/08-附录--图源--Excalidraw--Drawing 2026-06-02 09.46.26.excalidraw.html",
      "url": "obsidian://open?vault=RK3568&file=08-%E9%99%84%E5%BD%95%2F%E5%9B%BE%E6%BA%90%2FExcalidraw%2FDrawing%202026-06-02%2009.46.26.excalidraw"
    },
    {
      "title": "Drawing 2026-06-02 09.46.38.excalidraw",
      "folder": "08-附录/图源/Excalidraw",
      "filePath": "08-附录/图源/Excalidraw/Drawing 2026-06-02 09.46.38.excalidraw.md",
      "webPath": "pages/notes/08-附录--图源--Excalidraw--Drawing 2026-06-02 09.46.38.excalidraw.html",
      "url": "obsidian://open?vault=RK3568&file=08-%E9%99%84%E5%BD%95%2F%E5%9B%BE%E6%BA%90%2FExcalidraw%2FDrawing%202026-06-02%2009.46.38.excalidraw"
    },
    {
      "title": "课程正文模板",
      "folder": "08-附录/模板",
      "filePath": "08-附录/模板/课程正文模板.md",
      "webPath": "pages/notes/08-附录--模板--课程正文模板.html",
      "url": "obsidian://open?vault=RK3568&file=08-%E9%99%84%E5%BD%95%2F%E6%A8%A1%E6%9D%BF%2F%E8%AF%BE%E7%A8%8B%E6%AD%A3%E6%96%87%E6%A8%A1%E6%9D%BF"
    },
    {
      "title": "01-A盘基础资料目录解读",
      "folder": "08-附录/资料包",
      "filePath": "08-附录/资料包/01-A盘基础资料目录解读.md",
      "webPath": "pages/notes/08-附录--资料包--01-A盘基础资料目录解读.html",
      "url": "obsidian://open?vault=RK3568&file=08-%E9%99%84%E5%BD%95%2F%E8%B5%84%E6%96%99%E5%8C%85%2F01-A%E7%9B%98%E5%9F%BA%E7%A1%80%E8%B5%84%E6%96%99%E7%9B%AE%E5%BD%95%E8%A7%A3%E8%AF%BB"
    },
    {
      "title": "02-正点原子资料版本更新记录解读",
      "folder": "08-附录/资料包",
      "filePath": "08-附录/资料包/02-正点原子资料版本更新记录解读.md",
      "webPath": "pages/notes/08-附录--资料包--02-正点原子资料版本更新记录解读.html",
      "url": "obsidian://open?vault=RK3568&file=08-%E9%99%84%E5%BD%95%2F%E8%B5%84%E6%96%99%E5%8C%85%2F02-%E6%AD%A3%E7%82%B9%E5%8E%9F%E5%AD%90%E8%B5%84%E6%96%99%E7%89%88%E6%9C%AC%E6%9B%B4%E6%96%B0%E8%AE%B0%E5%BD%95%E8%A7%A3%E8%AF%BB"
    },
    {
      "title": "03-资料汇总PDF注意事项",
      "folder": "08-附录/资料包",
      "filePath": "08-附录/资料包/03-资料汇总PDF注意事项.md",
      "webPath": "pages/notes/08-附录--资料包--03-资料汇总PDF注意事项.html",
      "url": "obsidian://open?vault=RK3568&file=08-%E9%99%84%E5%BD%95%2F%E8%B5%84%E6%96%99%E5%8C%85%2F03-%E8%B5%84%E6%96%99%E6%B1%87%E6%80%BBPDF%E6%B3%A8%E6%84%8F%E4%BA%8B%E9%A1%B9"
    },
    {
      "title": "00-输出沉淀入口",
      "folder": "09-输出沉淀",
      "filePath": "09-输出沉淀/00-输出沉淀入口.md",
      "webPath": "pages/notes/09-输出沉淀--00-输出沉淀入口.html",
      "url": "obsidian://open?vault=RK3568&file=09-%E8%BE%93%E5%87%BA%E6%B2%89%E6%B7%80%2F00-%E8%BE%93%E5%87%BA%E6%B2%89%E6%B7%80%E5%85%A5%E5%8F%A3"
    },
    {
      "title": "00-项目三分钟讲解",
      "folder": "09-输出沉淀",
      "filePath": "09-输出沉淀/00-项目三分钟讲解.md",
      "webPath": "pages/notes/09-输出沉淀--00-项目三分钟讲解.html",
      "url": "obsidian://open?vault=RK3568&file=09-%E8%BE%93%E5%87%BA%E6%B2%89%E6%B7%80%2F00-%E9%A1%B9%E7%9B%AE%E4%B8%89%E5%88%86%E9%92%9F%E8%AE%B2%E8%A7%A3"
    },
    {
      "title": "04-V4L2专题-什么是dev-video0",
      "folder": "09-输出沉淀",
      "filePath": "09-输出沉淀/04-V4L2专题-什么是dev-video0.md",
      "webPath": "pages/notes/09-输出沉淀--04-V4L2专题-什么是dev-video0.html",
      "url": "obsidian://open?vault=RK3568&file=09-%E8%BE%93%E5%87%BA%E6%B2%89%E6%B7%80%2F04-V4L2%E4%B8%93%E9%A2%98-%E4%BB%80%E4%B9%88%E6%98%AFdev-video0"
    }
  ],
  "warnings": []
};
window.RK3568_COURSE = {
  "currentStage": "05",
  "stages": [
    {
      "id": "00",
      "maturity": "validated",
      "title": "总览",
      "objective": "先建立 IMX415、D-PHY、CSI、RKISP 与 /dev/videoX 的完整系统地图。",
      "sourcePath": "01-课程主线/00-系统总览.md",
      "path": "pages/system-map.html"
    },
    {
      "id": "01",
      "maturity": "validated",
      "title": "Linux Driver Model",
      "objective": "分清 bus、device、driver、Platform Driver、I2C Core 和 I2C Driver。",
      "sourcePath": "01-课程主线/01-Linux-Driver-Model.md",
      "path": "../../04-项目/15-Linux设备模型与总线分层.html"
    },
    {
      "id": "02",
      "maturity": "validated",
      "title": "DTS 与设备发现",
      "objective": "从原理图对到 DTS，并说明节点怎样变成运行时设备和 I2C client。",
      "sourcePath": "01-课程主线/02-DTS与设备发现.md",
      "path": "../../04-项目/20-DTS到运行时设备发现.html"
    },
    {
      "id": "03",
      "maturity": "validated",
      "title": "IMX415 Sensor",
      "objective": "讲清驱动注册、compatible 匹配、probe、上电、读 ID 与 V4L2 注册。",
      "sourcePath": "01-课程主线/03-IMX415-Sensor-Bring-up.md",
      "path": "../../04-项目/16-IMX415-三层驱动调用流程.html"
    },
    {
      "id": "04",
      "maturity": "validated",
      "title": "MIPI CSI-2 / D-PHY",
      "objective": "从 DTS endpoint 追到 D-PHY 和 Media Graph，解释 RAW 数据如何进入 SoC。",
      "sourcePath": "01-课程主线/04-MIPI-CSI2-DPHY.md",
      "path": "../../04-项目/17-DPHY-从DTS到MediaGraph.html"
    },
    {
      "id": "05",
      "maturity": "in-progress",
      "title": "V4L2 Subdev",
      "objective": "理解 Sensor 如何注册格式、controls、开流回调以及 Source Pad。",
      "sourcePath": "01-课程主线/05-V4L2-Subdev.md",
      "path": "../../04-项目/19-IMX415-v4l2-subdev注册与开流.html"
    },
    {
      "id": "06",
      "maturity": "published",
      "title": "Media Controller",
      "objective": "读懂 entity、pad、link 和 media-ctl 输出，并沿数据链逐节点验证。",
      "sourcePath": "01-课程主线/06-Media-Controller.md",
      "path": "../../04-项目/21-MediaController-Entity-Pad-Link.html"
    },
    {
      "id": "07",
      "maturity": "published",
      "title": "RKISP",
      "objective": "解释 RAW Bayer 如何进入 RKISP，并经 mainpath/selfpath 形成可取流节点。",
      "sourcePath": "01-课程主线/07-RKISP.md",
      "path": "../../04-项目/22-RKISP-从RAW到VideoNode.html"
    },
    {
      "id": "08",
      "maturity": "published",
      "title": "V4L2 用户态取流",
      "objective": "掌握格式协商、buffer queue、STREAMON 和 v4l2-ctl 抓帧验证。",
      "sourcePath": "01-课程主线/08-V4L2用户态取流.md",
      "path": "../../04-项目/23-V4L2-VB2用户态取流.html"
    },
    {
      "id": "09",
      "maturity": "placeholder",
      "title": "GStreamer / OpenCV",
      "objective": "把 V4L2 输出接入 GStreamer 和 OpenCV，并定位格式与转换问题。",
      "sourcePath": null,
      "path": "pages/notes/07-专项笔记--OpenCV--OpenCV读取Camera记录.html"
    },
    {
      "id": "10",
      "maturity": "placeholder",
      "title": "RKNN / YOLO",
      "objective": "理解 Camera 帧进入预处理、RKNN 推理和结果输出时的模块边界。",
      "sourcePath": null,
      "path": "pages/notes/07-专项笔记--系统--AI Camera系统数据流与模块边界.html"
    },
    {
      "id": "11",
      "maturity": "placeholder",
      "title": "Camera Bring-up 排障",
      "objective": "按供电、I2C、MIPI、Media、ISP、V4L2 分层定位新 Sensor 点亮故障。",
      "sourcePath": null,
      "path": "pages/notes/07-专项笔记--系统--AI Camera故障排查索引.html"
    }
  ]
};
