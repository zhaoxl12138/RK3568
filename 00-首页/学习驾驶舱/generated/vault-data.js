window.RK3568_VAULT_DATA = {
  "currentStage": "阶段 0，AI Camera 系统链路复盘",
  "currentTasks": [
    {
      "completed": false,
      "text": "阅读 [[02-从零到Python MVP学习路线|01-主线 / 从零到Python MVP学习路线]] 的阶段 0"
    },
    {
      "completed": false,
      "text": "对照 [[AI Camera系统数据流与模块边界|07-专项笔记 / 系统数据流与模块边界]] 画出数据流和控制流"
    },
    {
      "completed": false,
      "text": "用自己的话说明 Camera、V4L2、GStreamer、OpenCV、RKNN、显示和推流的边界"
    },
    {
      "completed": false,
      "text": "在本页补写本轮复盘结论，再进入阶段 1"
    }
  ],
  "stages": [
    {
      "id": "0",
      "label": "0 系统地图",
      "question": "数据从 Camera 怎样到显示和网络",
      "minimumEvidence": "一张数据流/控制流图",
      "criteria": "能说清每层输入、输出和边界",
      "evidenceEntry": "[[AI Camera系统数据流与模块边界]]",
      "status": "current"
    },
    {
      "id": "1",
      "label": "1 Buildroot 验机",
      "question": "板子、系统、网络是否可用",
      "minimumEvidence": "串口、SSH、系统信息、Camera 出图",
      "criteria": "能区分硬件故障、系统故障和应用故障",
      "evidenceEntry": "[[01-板子到手验机记录]]",
      "status": "unknown"
    },
    {
      "id": "2",
      "label": "2 Camera/V4L2",
      "question": "`/dev/video0` 代表什么",
      "minimumEvidence": "节点、media topology、格式列表",
      "criteria": "能解释 node、entity、pad、link 的关系",
      "evidenceEntry": "[[V4L2命令行抓帧记录]]",
      "status": "unknown"
    },
    {
      "id": "3",
      "label": "3 NV12 抓帧",
      "question": "原始帧是什么格式",
      "minimumEvidence": "一帧 NV12 文件和尺寸计算",
      "criteria": "能解释 Y/UV 平面、stride 和查看方式",
      "evidenceEntry": "[[V4L2命令行抓帧记录]]",
      "status": "unknown"
    },
    {
      "id": "4",
      "label": "4 OpenCV/GStreamer",
      "question": "为什么不用默认摄像头打开",
      "minimumEvidence": "成功 pipeline 和 BGR 图像",
      "criteria": "能定位 backend、caps、颜色转换问题",
      "evidenceEntry": "[[OpenCV读取Camera记录]]",
      "status": "unknown"
    },
    {
      "id": "5",
      "label": "5 RKNN 最小例程",
      "question": "Python 如何调用 NPU",
      "minimumEvidence": "`01_lenet` 输出和 runtime 版本",
      "criteria": "能区分模型、runtime、驱动和应用",
      "evidenceEntry": "[[官方AI例程运行记录]]",
      "status": "unknown"
    },
    {
      "id": "6",
      "label": "6 Camera + RKNN",
      "question": "图像如何进入模型并产生框",
      "minimumEvidence": "单帧/实时检测结果",
      "criteria": "能解释 resize、布局、量化、后处理和坐标回映",
      "evidenceEntry": "[[YOLOv5 Python最小推理记录]]",
      "status": "unknown"
    },
    {
      "id": "7",
      "label": "7 MIPI 显示",
      "question": "推理结果如何显示",
      "minimumEvidence": "屏幕方向、分辨率和实时画面",
      "criteria": "能说明 Camera MIPI 与 Display MIPI 是两条链路",
      "evidenceEntry": "[[MIPI屏显示链路]]",
      "status": "unknown"
    },
    {
      "id": "8",
      "label": "8 RTMP/HLS",
      "question": "画面如何离开板子",
      "minimumEvidence": "服务端地址和 Windows 播放结果",
      "criteria": "能区分编码、封装、协议、服务端和播放器",
      "evidenceEntry": "[[RTMP-HLS推流记录]]",
      "status": "unknown"
    },
    {
      "id": "9",
      "label": "9 Python MVP",
      "question": "能否独立复现完整链路",
      "minimumEvidence": "从启动到拉流的复测记录",
      "criteria": "不依赖逐行提示，能解释失败定位顺序",
      "evidenceEntry": "[[03-Python MVP演示手册]]",
      "status": "unknown"
    },
    {
      "id": "10",
      "label": "10 C++ 工程化",
      "question": "如何提升可维护性和性能",
      "minimumEvidence": "设计草图或独立实验",
      "criteria": "当前复盘完成前不作为主线验收",
      "evidenceEntry": "[[02-从零到Python MVP学习路线]]",
      "status": "unknown"
    }
  ],
  "domains": [
    {
      "name": "Camera",
      "filePath": "07-专项笔记/Camera-V4L2/IMX415驱动调试与最小demo路线.md",
      "url": "obsidian://open?vault=RK3568&file=07-%E4%B8%93%E9%A1%B9%E7%AC%94%E8%AE%B0%2FCamera-V4L2%2FIMX415%E9%A9%B1%E5%8A%A8%E8%B0%83%E8%AF%95%E4%B8%8E%E6%9C%80%E5%B0%8Fdemo%E8%B7%AF%E7%BA%BF"
    },
    {
      "name": "OpenCV",
      "filePath": "07-专项笔记/OpenCV/OpenCV读取Camera记录.md",
      "url": "obsidian://open?vault=RK3568&file=07-%E4%B8%93%E9%A1%B9%E7%AC%94%E8%AE%B0%2FOpenCV%2FOpenCV%E8%AF%BB%E5%8F%96Camera%E8%AE%B0%E5%BD%95"
    },
    {
      "name": "RKNN",
      "filePath": "07-专项笔记/AI-RKNN/官方AI例程运行记录.md",
      "url": "obsidian://open?vault=RK3568&file=07-%E4%B8%93%E9%A1%B9%E7%AC%94%E8%AE%B0%2FAI-RKNN%2F%E5%AE%98%E6%96%B9AI%E4%BE%8B%E7%A8%8B%E8%BF%90%E8%A1%8C%E8%AE%B0%E5%BD%95"
    },
    {
      "name": "Display",
      "filePath": "07-专项笔记/Display-MIPI/MIPI屏显示链路.md",
      "url": "obsidian://open?vault=RK3568&file=07-%E4%B8%93%E9%A1%B9%E7%AC%94%E8%AE%B0%2FDisplay-MIPI%2FMIPI%E5%B1%8F%E6%98%BE%E7%A4%BA%E9%93%BE%E8%B7%AF"
    },
    {
      "name": "Streaming",
      "filePath": "07-专项笔记/Streaming/RTMP-HLS推流记录.md",
      "url": "obsidian://open?vault=RK3568&file=07-%E4%B8%93%E9%A1%B9%E7%AC%94%E8%AE%B0%2FStreaming%2FRTMP-HLS%E6%8E%A8%E6%B5%81%E8%AE%B0%E5%BD%95"
    },
    {
      "name": "System",
      "filePath": "07-专项笔记/系统/AI Camera系统数据流与模块边界.md",
      "url": "obsidian://open?vault=RK3568&file=07-%E4%B8%93%E9%A1%B9%E7%AC%94%E8%AE%B0%2F%E7%B3%BB%E7%BB%9F%2FAI%20Camera%E7%B3%BB%E7%BB%9F%E6%95%B0%E6%8D%AE%E6%B5%81%E4%B8%8E%E6%A8%A1%E5%9D%97%E8%BE%B9%E7%95%8C"
    }
  ],
  "evidence": [
    {
      "name": "opencv_frame_gst.jpg",
      "type": "image",
      "mediaType": "image/jpeg",
      "assetPath": "../../05-实验与证据/实验产物/assets/opencv_frame_gst.jpg",
      "vaultPath": "05-实验与证据/实验产物/assets/opencv_frame_gst.jpg",
      "sourcePath": "05-实验与证据/实验产物/01-实验产物索引.md",
      "stageLabel": "OpenCV 读取 Camera。"
    },
    {
      "name": "scrfd_realtime_last.jpg",
      "type": "image",
      "mediaType": "image/jpeg",
      "assetPath": "../../05-实验与证据/实验产物/assets/scrfd_realtime_last.jpg",
      "vaultPath": "05-实验与证据/实验产物/assets/scrfd_realtime_last.jpg",
      "sourcePath": "05-实验与证据/实验产物/01-实验产物索引.md",
      "stageLabel": "AI 手册第 6 章，SCRFD 人脸检测。"
    },
    {
      "name": "scrfd_result_rotated.jpg",
      "type": "image",
      "mediaType": "image/jpeg",
      "assetPath": "../../05-实验与证据/实验产物/assets/scrfd_result_rotated.jpg",
      "vaultPath": "05-实验与证据/实验产物/assets/scrfd_result_rotated.jpg",
      "sourcePath": "05-实验与证据/实验产物/01-实验产物索引.md",
      "stageLabel": "AI 手册第 6 章，SCRFD 人脸检测。"
    },
    {
      "name": "yolo_hls_pull_test.mp4",
      "type": "video",
      "mediaType": "video/mp4",
      "assetPath": "../../05-实验与证据/实验产物/assets/yolo_hls_pull_test.mp4",
      "vaultPath": "05-实验与证据/实验产物/assets/yolo_hls_pull_test.mp4",
      "sourcePath": "05-实验与证据/实验产物/01-实验产物索引.md",
      "stageLabel": "unknown"
    },
    {
      "name": "yolo_hls_pull_test_frame.jpg",
      "type": "image",
      "mediaType": "image/jpeg",
      "assetPath": "../../05-实验与证据/实验产物/assets/yolo_hls_pull_test_frame.jpg",
      "vaultPath": "05-实验与证据/实验产物/assets/yolo_hls_pull_test_frame.jpg",
      "sourcePath": "05-实验与证据/实验产物/01-实验产物索引.md",
      "stageLabel": "unknown"
    },
    {
      "name": "yolov5_bus_result.jpg",
      "type": "image",
      "mediaType": "image/jpeg",
      "assetPath": "../../05-实验与证据/实验产物/assets/yolov5_bus_result.jpg",
      "vaultPath": "05-实验与证据/实验产物/assets/yolov5_bus_result.jpg",
      "sourcePath": "05-实验与证据/实验产物/01-实验产物索引.md",
      "stageLabel": "Python YOLOv5 RKNN 最小推理。"
    },
    {
      "name": "yolov5_camera_raw.jpg",
      "type": "image",
      "mediaType": "image/jpeg",
      "assetPath": "../../05-实验与证据/实验产物/assets/yolov5_camera_raw.jpg",
      "vaultPath": "05-实验与证据/实验产物/assets/yolov5_camera_raw.jpg",
      "sourcePath": "05-实验与证据/实验产物/01-实验产物索引.md",
      "stageLabel": "unknown"
    },
    {
      "name": "yolov5_camera_result.jpg",
      "type": "image",
      "mediaType": "image/jpeg",
      "assetPath": "../../05-实验与证据/实验产物/assets/yolov5_camera_result.jpg",
      "vaultPath": "05-实验与证据/实验产物/assets/yolov5_camera_result.jpg",
      "sourcePath": "05-实验与证据/实验产物/01-实验产物索引.md",
      "stageLabel": "unknown"
    },
    {
      "name": "yolov5_realtime_clean_last.jpg",
      "type": "image",
      "mediaType": "image/jpeg",
      "assetPath": "../../05-实验与证据/实验产物/assets/yolov5_realtime_clean_last.jpg",
      "vaultPath": "05-实验与证据/实验产物/assets/yolov5_realtime_clean_last.jpg",
      "sourcePath": "05-实验与证据/实验产物/01-实验产物索引.md",
      "stageLabel": "unknown"
    },
    {
      "name": "yolov5_realtime_last.jpg",
      "type": "image",
      "mediaType": "image/jpeg",
      "assetPath": "../../05-实验与证据/实验产物/assets/yolov5_realtime_last.jpg",
      "vaultPath": "05-实验与证据/实验产物/assets/yolov5_realtime_last.jpg",
      "sourcePath": "05-实验与证据/实验产物/01-实验产物索引.md",
      "stageLabel": "unknown"
    },
    {
      "name": "yolov5_rtmp_last.jpg",
      "type": "image",
      "mediaType": "image/jpeg",
      "assetPath": "../../05-实验与证据/实验产物/assets/yolov5_rtmp_last.jpg",
      "vaultPath": "05-实验与证据/实验产物/assets/yolov5_rtmp_last.jpg",
      "sourcePath": "05-实验与证据/实验产物/01-实验产物索引.md",
      "stageLabel": "unknown"
    }
  ],
  "quickLinks": [
    {
      "name": "taskBoard",
      "filePath": "06-任务/01-下一步任务看板.md",
      "url": "obsidian://open?vault=RK3568&file=06-%E4%BB%BB%E5%8A%A1%2F01-%E4%B8%8B%E4%B8%80%E6%AD%A5%E4%BB%BB%E5%8A%A1%E7%9C%8B%E6%9D%BF"
    },
    {
      "name": "activeRoute",
      "filePath": "01-主线/02-从零到Python MVP学习路线.md",
      "url": "obsidian://open?vault=RK3568&file=01-%E4%B8%BB%E7%BA%BF%2F02-%E4%BB%8E%E9%9B%B6%E5%88%B0Python%20MVP%E5%AD%A6%E4%B9%A0%E8%B7%AF%E7%BA%BF"
    },
    {
      "name": "dailyRecord",
      "filePath": "05-实验与证据/02-每日进度记录.md",
      "url": "obsidian://open?vault=RK3568&file=05-%E5%AE%9E%E9%AA%8C%E4%B8%8E%E8%AF%81%E6%8D%AE%2F02-%E6%AF%8F%E6%97%A5%E8%BF%9B%E5%BA%A6%E8%AE%B0%E5%BD%95"
    },
    {
      "name": "acceptance",
      "filePath": "07-专项笔记/系统/AI Camera分阶段验收标准.md",
      "url": "obsidian://open?vault=RK3568&file=07-%E4%B8%93%E9%A1%B9%E7%AC%94%E8%AE%B0%2F%E7%B3%BB%E7%BB%9F%2FAI%20Camera%E5%88%86%E9%98%B6%E6%AE%B5%E9%AA%8C%E6%94%B6%E6%A0%87%E5%87%86"
    },
    {
      "name": "project",
      "filePath": "04-项目/01-RK3568 YOLOv8n AI Camera项目.md",
      "url": "obsidian://open?vault=RK3568&file=04-%E9%A1%B9%E7%9B%AE%2F01-RK3568%20YOLOv8n%20AI%20Camera%E9%A1%B9%E7%9B%AE"
    },
    {
      "name": "projectTalk",
      "filePath": "04-项目/02-AI Camera项目讲解稿.md",
      "url": "obsidian://open?vault=RK3568&file=04-%E9%A1%B9%E7%9B%AE%2F02-AI%20Camera%E9%A1%B9%E7%9B%AE%E8%AE%B2%E8%A7%A3%E7%A8%BF"
    },
    {
      "name": "demo",
      "filePath": "04-项目/03-Python MVP演示手册.md",
      "url": "obsidian://open?vault=RK3568&file=04-%E9%A1%B9%E7%9B%AE%2F03-Python%20MVP%E6%BC%94%E7%A4%BA%E6%89%8B%E5%86%8C"
    },
    {
      "name": "evidenceMoc",
      "filePath": "05-实验与证据/00-实验与证据入口.md",
      "url": "obsidian://open?vault=RK3568&file=05-%E5%AE%9E%E9%AA%8C%E4%B8%8E%E8%AF%81%E6%8D%AE%2F00-%E5%AE%9E%E9%AA%8C%E4%B8%8E%E8%AF%81%E6%8D%AE%E5%85%A5%E5%8F%A3"
    },
    {
      "name": "outputMoc",
      "filePath": "09-输出沉淀/00-输出沉淀入口.md",
      "url": "obsidian://open?vault=RK3568&file=09-%E8%BE%93%E5%87%BA%E6%B2%89%E6%B7%80%2F00-%E8%BE%93%E5%87%BA%E6%B2%89%E6%B7%80%E5%85%A5%E5%8F%A3"
    }
  ],
  "warnings": [
    "Unknown stage status: 1 Buildroot 验机",
    "Unknown stage status: 2 Camera/V4L2",
    "Unknown stage status: 3 NV12 抓帧",
    "Unknown stage status: 4 OpenCV/GStreamer",
    "Unknown stage status: 5 RKNN 最小例程",
    "Unknown stage status: 6 Camera + RKNN",
    "Unknown stage status: 7 MIPI 显示",
    "Unknown stage status: 8 RTMP/HLS",
    "Unknown stage status: 9 Python MVP",
    "Unknown stage status: 10 C++ 工程化",
    "Evidence has unknown stage: yolo_hls_pull_test.mp4",
    "Evidence has unknown stage: yolo_hls_pull_test_frame.jpg",
    "Evidence has unknown stage: yolov5_camera_raw.jpg",
    "Evidence has unknown stage: yolov5_camera_result.jpg",
    "Evidence has unknown stage: yolov5_realtime_clean_last.jpg",
    "Evidence has unknown stage: yolov5_realtime_last.jpg",
    "Evidence has unknown stage: yolov5_rtmp_last.jpg"
  ]
};
