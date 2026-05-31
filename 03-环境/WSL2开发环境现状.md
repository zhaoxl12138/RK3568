# WSL2开发环境现状

## 宿主机

- 系统：Windows 10 Education 2009，19045.6456
- CPU：AMD Ryzen 5 5600 6-Core
- 内存：32GB
- 当前工作盘：`E:\RK3568`

## WSL2 - SDK 编译环境

- 发行版：Ubuntu-20.04
- Ubuntu 版本：20.04.6 LTS (Focal Fossa)
- WSL 版本：2
- 默认用户：`rk3568`
- 安装位置：`E:\wsl\Ubuntu-20.04`
- VHDX：`E:\wsl\Ubuntu-20.04\ext4.vhdx`
- 工作目录：`/home/rk3568/work`
- 状态：已安装，已设置为默认 WSL 发行版

## WSL2 - 旧环境记录

- 发行版：Ubuntu-22.04
- Ubuntu 版本：22.04.5 LTS
- 内核：6.6.114.1-microsoft-standard-WSL2
- 用户：`rk3568`
- VHDX 位置：`D:\CodeSoftware\wsl\ubuntu2204\ext4.vhdx`

## 旧环境状态

- WSL 当前曾记录为 Stopped。
- 开发工具基本空白。
- 已安装 Python3。
- 未安装 gcc/g++/cmake/OpenCV/RKNN Toolkit。

## 已知问题

VHDX 可能被 Windows 自动挂载为 Disk，导致 WSL 启动报 `ERROR_SHARING_VIOLATION`。

处理思路：

```powershell
Dismount-VHD
```

## 环境分工

- Ubuntu-20.04：当前主力环境，用于 SDK 编译和项目主开发，参考 [[Ubuntu与SDK编译注意事项]]。
- Ubuntu-22.04：旧环境记录，可用于普通实验，但不作为当前主线。

## 使用方式

- [[WSL2和VSCode使用说明]]

#WSL2 #Windows #Ubuntu
