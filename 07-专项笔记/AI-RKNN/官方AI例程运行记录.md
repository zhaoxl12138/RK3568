# 官方AI例程运行记录

## 当前目标

先跑通官方最小 AI 例程，不直接上 YOLO。

当前状态：暂停推进。

原因：当前学习主线先回到 Camera/V4L2 文档，把命令行抓帧和官方 Camera 应用开发手册对上。AI 例程等 Camera 和 OpenCV 基础过一遍后再继续。

这个例程的价值：

- `01_lenet` 是最小 RKNN 推理闭环。
- 它不依赖 Camera，不涉及视频流，便于单独验证 NPU/RKNN 运行环境。
- 跑通后才能说明板端 AI 推理链路基本可用。

## 本次选择的例程

官方资料路径：

`E:\【正点原子】RK3568开发板资料（A盘）-基础资料\01、程序源码\01、AI例程\01、源码\01_lenet`

已复制到简单路径：

`E:\RK3568\official_ai_examples\01_lenet`

文件：

- `atk_lenet_demo.py`：Python 推理脚本
- `LeNet5_mnist_model.rknn`：已经转换好的 RKNN 模型
- `5.png`：测试图片

## 依赖关系

脚本依赖：

- `python3`
- `cv2`
- `numpy`
- `rknnlite`

其中 `rknnlite` 来自 RKNN Toolkit Lite2，不是普通 Python 自带模块。

## 需要确认的板端环境

在 MobaXterm 的板端终端执行：

```bash
python3 --version
which python3
ls -l /dev/rknpu* 2>/dev/null
python3 - <<'PY'
import numpy
print("numpy ok")
import cv2
print("cv2 ok")
from rknnlite.api import RKNNLite
print("rknnlite ok")
PY
```

判断：

- 如果全部输出 `ok`，可以直接运行例程。
- 如果缺 `rknnlite`，需要安装匹配 Python 版本的 `rknn_toolkit_lite2` wheel。
- 如果缺 `cv2`，说明当前 Buildroot 镜像的 Python OpenCV 环境还没配好，需要按官方 AI 手册补齐。

## 上传和运行方式

推荐把本地目录上传到板子：

Windows 本地目录：

`E:\RK3568\official_ai_examples\01_lenet`

板端目录：

`/userdata/ai/01_lenet`

在板端运行：

```bash
mkdir -p /userdata/ai
cd /userdata/ai/01_lenet
python3 atk_lenet_demo.py
```

预期现象：

- 打印 `Load RKNN model`
- 打印 `Init runtime environment`
- 打印 `Running model`
- 输出 LeNet Top5 分类结果

## 当前阻塞点

Codex 当前不能直接接管用户已经打开的 MobaXterm 会话。

Windows 到板子的网络是通的，但非交互 SSH 需要认证输入，所以暂时不能由 Codex 直接远程执行板端命令。

当前策略：

- 用户在 MobaXterm 中粘贴板端命令。
- Codex 根据输出继续判断依赖是否齐全。
- 依赖齐全后继续跑 `atk_lenet_demo.py`。

#AI #RKNN #NPU #例程
