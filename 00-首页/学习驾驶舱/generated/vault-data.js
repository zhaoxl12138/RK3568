window.RK3568_VAULT_DATA = {
  "currentStage": "阶段 2：MIPI D-PHY 与 CSI-2",
  "currentTasks": [
    {
      "completed": false,
      "text": "完成 [[Camera驱动第2章-MIPI-DPHY与CSI2]] 中的 Lane、差分信号、D-PHY 与 CSI-2 基础学习"
    },
    {
      "completed": false,
      "text": "在板端 `media-ctl -p` 输出中指出 Sensor、D-PHY、CSI subdev 和 RKISP 对应的 entity、pad、link"
    },
    {
      "completed": false,
      "text": "用面试语言回答“Sensor ID 正常但没有图像，下一步为什么查 MIPI 链路”"
    }
  ],
  "stages": [
    {
      "id": "0",
      "stageKey": "stage-0",
      "normalizedLabel": "阶段 0 原理图与 DTS",
      "label": "0 原理图与 DTS",
      "question": "Sensor 的供电、I2C、MCLK、RESET、PDN 和 MIPI Lane 怎样映射进 DTS",
      "minimumEvidence": "原理图位置、实际 DTS 路径和节点逐行解释",
      "criteria": "能从一个新模组的原理图列出必须确认的 DTS 资源",
      "evidenceEntry": "[[Camera驱动第1章-IMX415-Sensor与驱动]]",
      "status": "planned"
    },
    {
      "id": "1",
      "stageKey": "stage-1",
      "normalizedLabel": "阶段 1 Sensor 驱动与 probe",
      "label": "1 Sensor 驱动与 probe",
      "question": "DTS 节点怎样变成 I2C client，并调用 `imx415_probe()`",
      "minimumEvidence": "`4-001a-1`、driver 绑定、Sensor ID 日志和函数调用链",
      "criteria": "能解释驱动注册与设备创建为何可以先后并行、最终在哪里匹配",
      "evidenceEntry": "[[Camera驱动第1章-IMX415-Sensor与驱动]]",
      "status": "planned"
    },
    {
      "id": "2",
      "stageKey": "stage-2",
      "normalizedLabel": "阶段 2 MIPI D-PHY 与 CSI-2",
      "label": "2 MIPI D-PHY 与 CSI-2",
      "question": "RAW10 怎样通过差分 Lane 进入 SoC",
      "minimumEvidence": "endpoint、Lane 配置、D-PHY entity 和 CSI entity",
      "criteria": "能区分 D-PHY 物理层、CSI-2 协议层与 I2C 控制通道",
      "evidenceEntry": "[[Camera驱动第2章-MIPI-DPHY与CSI2]]",
      "status": "current"
    },
    {
      "id": "3",
      "stageKey": "stage-3",
      "normalizedLabel": "阶段 3 endpoint 与 Media Graph",
      "label": "3 endpoint 与 Media Graph",
      "question": "两端 endpoint 怎样形成 entity、pad、link",
      "minimumEvidence": "`media-ctl -p` 完整拓扑",
      "criteria": "能从 Sensor 沿 ENABLED link 追到 RKISP，并解释 Sink/Source pad",
      "evidenceEntry": "[[2026-07-28-直连板端读取IMX415配置]]",
      "status": "planned"
    },
    {
      "id": "4",
      "stageKey": "stage-4",
      "normalizedLabel": "阶段 4 RKISP",
      "label": "4 RKISP",
      "question": "RKISP 接收什么、处理什么、输出什么",
      "minimumEvidence": "ISP sink/source 格式与 crop 信息",
      "criteria": "能解释 RAW Bayer 进入 ISP 后为何可以得到 YUV/NV12",
      "evidenceEntry": "[[AI Camera系统数据流与模块边界]]",
      "status": "planned"
    },
    {
      "id": "5",
      "stageKey": "stage-5",
      "normalizedLabel": "阶段 5 V4L2、VB2 与 `/dev/video0`",
      "label": "5 V4L2、VB2 与 `/dev/video0`",
      "question": "video 节点怎样创建，应用怎样取得帧",
      "minimumEvidence": "`v4l2-ctl --all`、格式列表和成功抓帧",
      "criteria": "能解释 video_device、vb2 queue、multiplanar 和缓冲区流转",
      "evidenceEntry": "[[V4L2命令行抓帧记录]]",
      "status": "planned"
    },
    {
      "id": "6",
      "stageKey": "stage-6",
      "normalizedLabel": "阶段 6 controls 与 stream",
      "label": "6 controls 与 stream",
      "question": "曝光、增益、格式和开流怎样进入 Sensor 寄存器",
      "minimumEvidence": "control 输出、`set fmt`、`set exposure` 或寄存器日志",
      "criteria": "能说清 probe 成功与真正 stream on 的区别",
      "evidenceEntry": "[[Camera驱动第1章-IMX415-Sensor与驱动]]",
      "status": "planned"
    },
    {
      "id": "7",
      "stageKey": "stage-7",
      "normalizedLabel": "阶段 7 分层故障定位",
      "label": "7 分层故障定位",
      "question": "有节点无图、无节点、Sensor ID 失败、帧异常分别从哪里查",
      "minimumEvidence": "一份按层次排列的排查记录",
      "criteria": "能根据现象选择电源/I2C/MIPI/ISP/V4L2 中的第一检查点",
      "evidenceEntry": "[[AI Camera故障排查索引]]",
      "status": "planned"
    },
    {
      "id": "8",
      "stageKey": "stage-8",
      "normalizedLabel": "阶段 8 新 Sensor 移植",
      "label": "8 新 Sensor 移植",
      "question": "换一颗 Sensor 时要改哪些硬件、DTS、驱动和 mode 表",
      "minimumEvidence": "移植清单与最小改动范围",
      "criteria": "能说明哪些来自数据手册，哪些来自板级原理图，哪些必须实测",
      "evidenceEntry": "[[IMX415驱动调试与最小demo路线]]",
      "status": "planned"
    },
    {
      "id": "9",
      "stageKey": "stage-9",
      "normalizedLabel": "阶段 9 实板证据包",
      "label": "9 实板证据包",
      "question": "如何证明这条链路确实在自己的板子上工作",
      "minimumEvidence": "DTS、I2C、probe、Media Graph、格式和抓帧证据",
      "criteria": "任一结论都能回到当前板卡的原始输出",
      "evidenceEntry": "[[2026-07-28-Camera驱动Day1验收]]",
      "status": "planned"
    },
    {
      "id": "10",
      "stageKey": "stage-10",
      "normalizedLabel": "阶段 10 面试复述",
      "label": "10 面试复述",
      "question": "怎样在 3～5 分钟讲清 Camera 驱动初始化和出图链路",
      "minimumEvidence": "口述稿、追问回答和一次模拟面试",
      "criteria": "不看笔记讲清主线，能回答至少三个故障追问",
      "evidenceEntry": "[[Camera驱动求职第1周执行计划]]",
      "status": "planned"
    }
  ],
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
  "evidence": [],
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
      "filePath": "06-任务/Camera驱动第1章-IMX415-Sensor与驱动.md",
      "url": "obsidian://open?vault=RK3568&file=06-%E4%BB%BB%E5%8A%A1%2FCamera%E9%A9%B1%E5%8A%A8%E7%AC%AC1%E7%AB%A0-IMX415-Sensor%E4%B8%8E%E9%A9%B1%E5%8A%A8",
      "webPath": "pages/notes/06-任务--Camera驱动第1章-IMX415-Sensor与驱动.html"
    },
    {
      "name": "dailyRecord",
      "filePath": "05-实验与证据/2026-07-28-Camera驱动Day1验收.md",
      "url": "obsidian://open?vault=RK3568&file=05-%E5%AE%9E%E9%AA%8C%E4%B8%8E%E8%AF%81%E6%8D%AE%2F2026-07-28-Camera%E9%A9%B1%E5%8A%A8Day1%E9%AA%8C%E6%94%B6",
      "webPath": "pages/notes/05-实验与证据--2026-07-28-Camera驱动Day1验收.html"
    },
    {
      "name": "acceptance",
      "filePath": "07-专项笔记/系统/Camera驱动分阶段验收标准.md",
      "url": "obsidian://open?vault=RK3568&file=07-%E4%B8%93%E9%A1%B9%E7%AC%94%E8%AE%B0%2F%E7%B3%BB%E7%BB%9F%2FCamera%E9%A9%B1%E5%8A%A8%E5%88%86%E9%98%B6%E6%AE%B5%E9%AA%8C%E6%94%B6%E6%A0%87%E5%87%86",
      "webPath": "pages/notes/07-专项笔记--系统--Camera驱动分阶段验收标准.html"
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
      "title": "Camera驱动第1章-IMX415-Sensor与驱动",
      "folder": "06-任务",
      "filePath": "06-任务/Camera驱动第1章-IMX415-Sensor与驱动.md",
      "webPath": "pages/notes/06-任务--Camera驱动第1章-IMX415-Sensor与驱动.html",
      "url": "obsidian://open?vault=RK3568&file=06-%E4%BB%BB%E5%8A%A1%2FCamera%E9%A9%B1%E5%8A%A8%E7%AC%AC1%E7%AB%A0-IMX415-Sensor%E4%B8%8E%E9%A9%B1%E5%8A%A8"
    },
    {
      "title": "IMX415-DTS 解读 -2026年7月31日",
      "folder": "06-任务",
      "filePath": "06-任务/IMX415-DTS 解读 -2026年7月31日.md",
      "webPath": "pages/notes/06-任务--IMX415-DTS 解读 -2026年7月31日.html",
      "url": "obsidian://open?vault=RK3568&file=06-%E4%BB%BB%E5%8A%A1%2FIMX415-DTS%20%E8%A7%A3%E8%AF%BB%20-2026%E5%B9%B47%E6%9C%8831%E6%97%A5"
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
      "title": "Camera驱动分阶段验收标准",
      "folder": "07-专项笔记/系统",
      "filePath": "07-专项笔记/系统/Camera驱动分阶段验收标准.md",
      "webPath": "pages/notes/07-专项笔记--系统--Camera驱动分阶段验收标准.html",
      "url": "obsidian://open?vault=RK3568&file=07-%E4%B8%93%E9%A1%B9%E7%AC%94%E8%AE%B0%2F%E7%B3%BB%E7%BB%9F%2FCamera%E9%A9%B1%E5%8A%A8%E5%88%86%E9%98%B6%E6%AE%B5%E9%AA%8C%E6%94%B6%E6%A0%87%E5%87%86"
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
      "title": "04-V4L2专题-什么是dev-video0",
      "folder": "09-输出沉淀",
      "filePath": "09-输出沉淀/04-V4L2专题-什么是dev-video0.md",
      "webPath": "pages/notes/09-输出沉淀--04-V4L2专题-什么是dev-video0.html",
      "url": "obsidian://open?vault=RK3568&file=09-%E8%BE%93%E5%87%BA%E6%B2%89%E6%B7%80%2F04-V4L2%E4%B8%93%E9%A2%98-%E4%BB%80%E4%B9%88%E6%98%AFdev-video0"
    }
  ],
  "warnings": []
};
