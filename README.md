# RK3568 AI视觉学习复盘仓库

这是 RK3568 AI Camera 项目的 Obsidian 学习复盘仓库，不是代码主仓库。

本仓库用于记录：

- 学习路线
- 官方资料阅读顺序
- 实验过程和结果
- 概念复盘
- 面试表达和项目讲解

代码、脚本和工程化实验放在：

- [zhaoxl12138/rk3568_ai_camera](https://github.com/zhaoxl12138/rk3568_ai_camera)

## 当前成果链路

当前已经跑通 Python MVP：

```text
IMX415 MIPI Camera
-> RKISP / V4L2
-> GStreamer
-> OpenCV
-> YOLOv5 RKNN / NPU
-> MIPI屏显示
-> RTMP/HLS
-> Windows ffplay 拉流
```

当前实际项目版本：

```text
RK3568 YOLOv5 RKNN AI Camera Python MVP
```

YOLOv8n 仍是最终目标，但当前不是已完成版本。

## 推荐阅读顺序

每天从这里开始：

- [[00-RK3568学习主入口]]

第一轮复盘按这个顺序读：

1. [[01-从零到Python MVP学习路线]]
2. [[00-当前阅读位置和下一步文档]]
3. [[01-官方PDF与外部链接索引]]
4. [[00-概念索引]]
5. [[Python MVP演示手册]]
6. [[AI-Camera项目五分钟讲解]]

## 当前阶段

功能已经跑通 Python MVP。

现在不是继续扩功能，而是：

```text
按阶段0到阶段9重新复盘，把 Camera、V4L2、GStreamer、OpenCV、RKNN、MIPI、HLS 每一步讲清楚。
```

## 仓库边界

本仓库可以记录代码路径、运行命令、截图和实验结论。

本仓库不作为正式源码仓库，不复制大段源码，不承担工程构建职责。

正式代码仓库见：

- [zhaoxl12138/rk3568_ai_camera](https://github.com/zhaoxl12138/rk3568_ai_camera)

#RK3568 #AI视觉 #Obsidian #PythonMVP
