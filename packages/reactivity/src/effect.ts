export let activeEffect = undefined
// 依赖收集原理：借助js单线程，
// 默认调用effect回去调用proxy的get，此时属性记住依赖的effect
// 同理也让effect记住对应的属性
// weakMap:{map:{key:new Set()}}
// 数据变化的时候，找到对应的map，通过属性触发set中effect
//响应式effect
export class ReactiveEffect {
  public active = true
  public parent = null //属性描述
  public deps = [] //effect中用了哪些属性，后续清理的时候要使用
  // 传一个fn，就直接放到this上
  constructor(public fn) {}
  run() {
    if (!this.active) {
      return this.fn()
    } else {
      // 依赖收集 让属性和effect产生关联
      // 取值的时候，让属性和当前effect函数关联起来，数据变化重新执行effect
      try {
        this.parent = activeEffect
        activeEffect = this //暴露到全局
        return this.fn() //去proxy对象上取值
      } finally {
        //因为effect函数之外是不需要依赖收集的
        activeEffect = this.parent
        this.parent = null
      }
    }
  }
}
// 哪个对象中的哪个属性，对应的哪个effect，一个属性对应多个effect
// 外层用一个map{object：{name:[effect,effect]},age:[effect,effect]}
const targetMap = new WeakMap()
// 触发更新
export function trigger(target, key, value) {
  let depsMap = targetMap.get(target)
  if (!depsMap) {
    return //属性没用依赖任何effect
  }
  const effects = depsMap.get(key)
  effects &&
    effects.forEach((effect) => {
      // 防止effect里面改变数据，死循环问题
      if (effect !== activeEffect) {
        effect.run() //数据变化重新执行effect
      }
    })
}
// 收集依赖
export function track(target, key) {
  console.log(target, key, activeEffect)
  if (activeEffect) {
    // 依赖收集
    let depsMap = targetMap.get(target)
    if (!depsMap) {
      targetMap.set(target, (depsMap = new Map()))
    }
    let deps = depsMap.get(key)
    if (!deps) {
      depsMap.set(key, (deps = new Set()))
    }
    let shouldTrack = !deps.has(activeEffect)
    if (shouldTrack) {
      // 互相记住
      deps.add(activeEffect)
      activeEffect.deps.push(deps)
    }
  }
}
//副作用函数
export function effect(fn) {
  //将传递的函数变成响应式的effect
  const _effect = new ReactiveEffect(fn)
  _effect.run()
}
