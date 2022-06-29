//判断有没有reactive过，来决定是否用缓存
export const enum ReactiveFlag {
  IS_REACTIVE = '__v__isReactive'
}
import { track, trigger } from './effect'
// proxy里的处理逻辑
export const baseHandler = {
  get(target, key, receiver) {
    if (key === ReactiveFlag.IS_REACTIVE) {
      return true
    }
    // console.log('这里可以记录这个属性使用了哪个effect')
    // 收集依赖
    track(target, key)
    return Reflect.get(target, key, receiver)
  },
  set(target, key, value, receiver) {
    // console.log('这里可以通知effect重新执行')
    // 数据变化后，要根据属性找到对应的effect列表让其依次执行
    let oldValue = Reflect.set(target, key, value, receiver)
    let result = true
    if (oldValue !== value) {
      result = Reflect.set(target, key, value, receiver)
      // 触发更新
      trigger(target, key, value)
      return result
    }
  }
}
