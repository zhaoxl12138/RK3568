# RK3568 YOLOv8n AI Camera项目

本文件只描述最终要做成的项目，不承担学习路线功能。

学习路线见 [[00-AI视觉系统主线]]。

当前任务见 [[下一步任务看板]]。

## 项目目标

做一个可以用于 GitHub 展示和求职说明的 AI 视觉系统工程项目。

不是训练新模型，而是把 Camera、Linux、多媒体、AI 推理、推流做成完整闭环。

## 硬件

- RK3568 正点原子开发板
- 4G + 64G
- IMX415 MIPI Camera

## 最终闭环

Camera -> V4L2/GStreamer -> OpenCV -> YOLOv8n -> NCNN/RKNN -> RTSP/RTMP -> Linux部署

## 软件目标

- C++17
- CMake
- Linux 工程化
- 模块化
- 可维护
- 可写 README
- 可放 GitHub

## 计划模块

- `camera`: V4L2/GStreamer 采集
- `preprocess`: 图像格式转换和缩放
- `detector`: YOLOv8n 推理
- `postprocess`: NMS、画框、结果输出
- `streamer`: RTSP/RTMP 推流
- `config`: 配置文件
- `app`: 主程序入口

#项目 #YOLOv8n #RKNN #Camera #RTSP
