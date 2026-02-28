# Mathematics formula for adding liquidity with a single token

Pls add **[MathJax plugin](https://chrome.google.com/webstore/detail/mathjax-plugin-for-github/ioemnmodlmafdkllaclgeombjnmnbima)** to view math formulas for this page.

Assume that:

- $r_{in}$, $r_{out}$, $v_{in}$, $v_{out}$ are the real balance and virtual balance of token input and the other
- $u_{in}$ is the amount of input token
- $x_1$ is the amount to swap to $y$ of the other token and and $x_2$ is the amount to add liquidity to the pool
- r is equals to 1 - fee

We will have
$x_1 + x_2 = u_{in}$ (1)
When swap token in to tokenOut
$(r * x_1 + v_{in})*(v_{out} - y) = v_{in} * v_{out}$
<=> $r * x_1 * v_{out}= y * (r * x_1 + v_{in})$ (2)

When add liquidity to the pool, the ratio of both tokens should be equal to the ratio of real reserve
$\frac{y}{r_{out} - y}=\frac{x_2}{r_{in}+x_1}$
<=> $y*(r_{in}+x_1) = (r_{out} - y) * x_2$
<=> $y*(r_{in}+x_1+x_2) = r_{out}*x_2$ (3)

From (1) and (3):
$y*(r_{in}+u_{in}) = r_{out} * (u_{in} - x_1)$ (4)

From (2) and (4):
$(r * x_1 + v_{in}) * r_{out} * (u_{in} - x_1)= (r_{in}+u_{in}) * r * x_1 * v_{out}$
<=> $r * r_{out} * x_1^2 + ((r_{in}+u_{in}) * r  * v_{out}  + r_{out} * (u_{in} * r - v_{in}))*x_1 - r_{out} * u_{in} * v_{in} = 0$
<=> $r * x_1^2 + (\frac{u_{in} * (v_{out} - r_{out}) + v_{out} * r_{in}}{r_{out}} * r+ v_{in})*x_1  + u_{in} * v_{in} = 0$
<=> $a * x_1^2 + b * x_1 + c =0$
with

- $b = [r_{in} * v_{out} * r  + r * u_{in}(v_{out} - r_{out}) ] / r_{out} + v_{in}$
- $a = r$
- $c = u_{in} * v_{in}$

Then we calculate x_1 by the Quadratic Formula

In case of uniswap, when $v_{in}=r_{in}$, $v_{out}=r_{out}$ and r = 0.997
a = 0.997
$b = 1.997 * r_{in}$
$c=u_{in} * r_{in}$

$x_1 =\frac{\sqrt{3,988009 * r_{in}^2 + 4 * 0.997 * r_{in} * u_{in}} -  1.997 * r_{in}}{1.994}$

This math can be found [here](https://etherscan.io/address/0x6d9893fa101cd2b1f8d1a12de3189ff7b80fdc10#code#F3#L1)

```solidity=
function calculateSwapInAmount(uint256 reserveIn, uint256 userIn)
  internal
  pure
  returns (uint256)
{
  return (
    Babylonian.sqrt(
      reserveIn * ((userIn * 3988000) + (reserveIn * 3988009))
    ) - (reserveIn * 1997)
  ) / 1994;
}
```
