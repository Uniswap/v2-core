# 入门文档：Light Ecosystem Swap Core

## 简介

Swap Core（https://github.com/Light-Ecosystem/swap-core）是一个基于以太坊的去中心化交易协议，用于实现加密货币之间的自动化流动性提供。该协议允许用户在不需要中心化交易所的情况下，直接与智能合约进行交易。

基于 Uniswap V2，扩展了以下功能：

- 调整交易手续费归属社区的比例为的 50%
- 支持白名单管理可交易资产，由社区通过投票获得准入资格，避免不良资产进入交易市场；
- 支持手续费动态可调，由社区来控制交易手续费；
- 支持包含 stHOPE 的交易对索取 LT 奖励；
  同时升级和完善了开发环境和部署脚本。

集成测试环境可以参考 Swap Periphery（https://github.com/Light-Ecosystem/swap-periphery）。

SlowMist，CertiK 两家审计机构对代码进行了审计，审计报告见：

- audit report by slow mist（url）
- audit report by certik（url）

## 开始之前

确保您已经安装了以下工具：

1. Node.js (v18.13.0 或更高)
2. Yarn (v1.22.19 或更高)
3. Git

## 步骤 1：克隆仓库

打开终端，输入以下命令克隆仓库：

继续

```bash
git clone https://github.com/Light-Ecosystem/swap-core.git
cd swap-core
```

## 步骤 2：安装依赖

在仓库的根目录下，运行以下命令安装项目依赖：

```bash
yarn install
```

## 步骤 3：编译合约

编译智能合约，运行以下命令：

```bash
yarn compile
```

## 步骤 4：测试

为确保一切正常，运行测试用例：

```bash
yarn test
```

## 文档和支持

要了解更多关于 Light Ecosystem Swap Core 的信息，请参阅项目的 [GitHub 仓库](https://github.com/Light-Ecosystem/swap-core)。这里您可以找到更多关于智能合约、接口和项目架构的详细信息。

如果您在使用过程中遇到问题，可以查阅 [GitHub Issues](https://github.com/Light-Ecosystem/swap-core/issues) 寻求帮助。您也可以提交的 Issue 以报告问题或提出建议。
