# RKNN专题-RKNN运行机制

## 要回答的问题

```text
Python 代码是怎么调用 RK3568 NPU 推理的？
```

## 当前项目里的位置

```text
OpenCV Mat -> 前处理 -> RKNNLite -> RKNN Runtime -> NPU -> 输出
```

## 必须讲清的点

- `.rknn` 是 Rockchip NPU 可运行的模型格式。
- `rknn-toolkit-lite2` 是板端 Python 推理接口。
- `librknnrt.so` 是板端 runtime。
- `rknn_server` 是板端服务组件。
- NPU driver 是内核侧驱动。
- `rknn.inference()` 不是普通 CPU 推理，它会通过 RKNN runtime 调 NPU。

## 当前已验证事实

```text
rknn-toolkit-lite2：1.5.0
rknn_server：1.5.0
librknnrt.so：1.5.0
NPU driver：0.8.2
01_lenet 输出：[5]: 1.0
```

## 面试表达草稿

```text
我先用官方 01_lenet 例程验证 RKNN 基础链路。
板端需要 RKNNLite Python 包、librknnrt.so、rknn_server 和 NPU driver 配套。
应用层通过 RKNNLite 加载 .rknn 模型，调用 inference 后进入 RKNN runtime，再由 runtime 调用 NPU driver 完成推理。
```

## 关联笔记

- [[官方AI例程运行记录]]
- [[YOLOv5 Python最小推理记录]]
- [[00-概念索引]]

#RKNN #NPU #RKNNLite #librknnrt
