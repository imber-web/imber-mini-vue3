export class ReactiveEffect {
  public active = true
  // 传一个fn，就直接放到this上
  constructor(public fn) {}
  run() {
    this.fn() //去proxy对象上取值
  }
}

export function effect(fn) {
  //将传递的函数变成响应式的effect
  const _effect = new ReactiveEffect(fn)
  _effect.run()
}
