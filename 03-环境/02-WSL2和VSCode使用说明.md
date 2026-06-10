# WSL2和VSCode使用说明

## 一句话理解

WSL2 是 Windows 里的 Linux 运行机制，Ubuntu 20.04 是装在这个机制上的 Linux 系统。

可以这样理解：

- WSL2：引擎，由 Windows 提供。
- Ubuntu 20.04：车，也就是 Linux 根文件系统。
- `E:\wsl\Ubuntu-20.04\ext4.vhdx`：这辆车的硬盘。
- VS Code WSL 插件：驾驶舱，让我在 Windows 界面里操作 Linux。

## 和传统虚拟机的区别

以前用 VMware 或 VirtualBox：

- 启动一个完整 Ubuntu 桌面系统。
- 有桌面、有虚拟显示器、有模拟硬件。
- 启动慢，占用内存多。

现在用 WSL2：

- 没有 Ubuntu 桌面。
- 主要是命令行 Linux。
- 启动快，适合编译 SDK、写 C/C++、跑 Linux 工具链。

## 我当前的 WSL 环境

当前环境见 [[03-WSL2开发环境现状]]。

重点信息：

- 发行版：`Ubuntu-20.04`
- Ubuntu 版本：`20.04.6 LTS`
- 默认用户：`rk3568`
- 安装位置：`E:\wsl\Ubuntu-20.04`
- Linux 工作目录：`/home/rk3568/work`

## 怎么进入 Ubuntu

方式1：Windows Terminal

打开 Windows Terminal，选择 `Ubuntu-20.04`。

方式2：PowerShell

```powershell
wsl
```

进入后看到类似下面的提示，就说明在 Ubuntu 里：

```bash
rk3568@主机名:/mnt/e/RK3568$
```

## VS Code 怎么连接 WSL

VS Code 安装 `WSL` 插件后：

1. 按 `F1`
2. 输入 `WSL: Connect to WSL`
3. 选择 `Ubuntu-20.04`
4. 左下角显示 `WSL: Ubuntu-20.04`

这时 VS Code 的界面在 Windows 上，但代码、终端、编译器都在 Ubuntu 里面。

## 推荐打开的工作目录

进入 WSL 后：

```bash
cd ~/work
code .
```

这会用 VS Code 打开 Linux 内部目录：

```bash
/home/rk3568/work
```

SDK、源码、编译工程建议放这里，不要放到 `/mnt/e` 下面。

## 为什么不建议把 SDK 放 /mnt/e

`/mnt/e` 是 Windows E 盘挂载到 Linux 里的路径。

它适合临时访问资料，不适合编译大型 SDK。

原因：

- 大量小文件读写会慢。
- Linux 权限、符号链接、大小写行为可能和原生 ext4 不完全一致。
- SDK 编译更适合放在 WSL 内部 ext4 文件系统。

推荐：

```bash
/home/rk3568/work/rk3568_sdk
```

## Windows 怎么查看 WSL 文件

在 Windows 文件资源管理器地址栏输入：

```text
\\wsl$\Ubuntu-20.04\home\rk3568\work
```

就能看到 Linux 内部文件。

## 常用命令

查看当前用户：

```bash
whoami
```

查看 Ubuntu 版本：

```bash
lsb_release -a
```

进入工作目录：

```bash
cd ~/work
```

用 VS Code 打开当前目录：

```bash
code .
```

关闭所有 WSL：

```powershell
wsl --shutdown
```

## 我的使用原则

- Windows Terminal：连接 Ubuntu、跑命令。
- VS Code + WSL 插件：写代码、打开工程、编译调试。
- `/home/rk3568/work`：放 SDK 和源码。
- `/mnt/e`：只用于访问 Windows 资料和临时文件。

## 相关笔记

- [[03-WSL2开发环境现状]]
- [[01-Ubuntu与SDK编译注意事项]]
- [[01-RK3568 YOLOv8n AI Camera项目]]

#WSL2 #VSCode #Ubuntu #开发环境

