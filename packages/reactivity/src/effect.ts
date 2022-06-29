export let activeEffect = undefined
// 依赖收集原理：借助js单线程，
// 默认调用effect回去调用proxy的get，此时属性记住依赖的effect
// 同理也让effect记住对应的属性
// weakMap:{map:{key:new Set()}}
// 数据变化的时候，找到对应的map，通过属性触发set中effect

// 清理操作
function cleanEffect(effect) {
  // 需要清理effect中存入属性中的set中的effect
  let deps = effect.deps //set
  //因为这个deps是引用数据类型,后面this.fn()会增加导致无限循环
  // 用effects = new Set(effects) 消除引用关系
  for (let i = 0; i < deps.length; i++) {
    deps[i].delete(effect)
  }
  effect.deps.length = 0
}
//响应式effect
export class ReactiveEffect {
  public active = true
  public parent = null //属性描述
  public deps = [] //effect中用了哪些属性，后续清理的时候要使用
  // 传一个fn，就直接放到this上
  constructor(public fn, public scheduler?) {}
  // this就是effect
  run() {
    if (!this.active) {
      return this.fn()
    } else {
      // 依赖收集 让属性和effect产生关联
      // 取值的时候，让属性和当前effect函数关联起来，数据变化重新执行effect
      try {
        this.parent = activeEffect
        activeEffect = this //暴露到全局
        cleanEffect(this) //清除操作
        return this.fn() //去proxy对象上取值
      } finally {
        //因为effect函数之外是不需要依赖收集的
        activeEffect = this.parent
        this.parent = null
      }
    }
  }
  stop() {
    if (this.active) {
      this.active = false
      cleanEffect(this)
    }
  }
}
// 哪个对象中的哪个属性，对应的哪个effect，一个属性对应多个effect
// 外层用一个map{object：{name:[effect,effect]},age:[effect,effect]}
const targetMap = new WeakMap() //必须在上层,利用单线程,后面能取出effect
// 触发更新
export function trigger(target, key, value) {
  let depsMap = targetMap.get(target)
  if (!depsMap) {
    return //属性没用依赖任何effect
  }
  let effects = depsMap.get(key) //set[effect]
  triggerEffects(effects)
}
// 触发effects
export function triggerEffects(effects) {
  if (effects) {
    effects = new Set(effects) //用于清除操作，避免循环依赖
    effects.forEach((effect) => {
      // 防止effect里面改变数据，死循环问题
      if (effect !== activeEffect) {
        if (effect.scheduler) {
          effect.scheduler() //提供一个调度函数,如果用户提供scheduler,优先走scheduler
        } else {
          effect.run() //数据变化重新执行effect
        }
      }
    })
  }
}
// 收集依赖
export function track(target, key) {
  // console.log(target, key, activeEffect)
  if (activeEffect) {
    // 依赖收集
    let depsMap = targetMap.get(target) //从weakmap中获取的map
    if (!depsMap) {
      targetMap.set(target, (depsMap = new Map())) //这个就是存东西的!!!,通过引用关系存进来了
    }
    let deps = depsMap.get(key) //从map中获取的set
    if (!deps) {
      depsMap.set(key, (deps = new Set()))
    }
    trackEffects(deps)
  }
}
// 收集effects
export function trackEffects(deps) {
  let shouldTrack = !deps.has(activeEffect)
  if (shouldTrack) {
    // debugger
    //没用这个激活的effect再添加
    // 属性记住effect
    deps.add(activeEffect) //[effect]
    // effect记住属性,因为activeEffect是个类,然后public deps,所以有这方法
    activeEffect.deps.push(deps) //存的每个属性对应的set
    // effect.deps = [[effct]]
  }
}
//副作用函数
export function effect(fn, options = {} as any) {
  //将传递的函数变成响应式的effect
  const _effect = new ReactiveEffect(fn, options.scheduler)
  _effect.run()
  // effect返回runner的目的是让用户可以自己控制渲染逻辑
  const runner = _effect.run.bind(_effect)
  runner.effect = _effect //暴露effct实例
  return runner //用户可以手动调用runner重新执行
}
