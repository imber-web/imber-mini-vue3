import { isObject } from '@vue/shared'
import { trackEffects, triggerEffects } from './effect'
import { reactive } from './reactive'

export function ref(value) {
  return new RefImpl(value)
}
export function toRefs(object) {
  let result = {}
  for (let key in object) {
    result[key] = toRef(object, key)
  }
  return result
}
export function toRef(object, key) {
  return new ObjectRefImpl(object, key)
}
export function proxyRefs(object) {
  return new Proxy(object, {
    get(target, key, receiver) {
      let r = Reflect.get(target, key, receiver)
      return r.__v_isRef ? r.value : r
    },
    set(target, key, value, receiver) {
      if (target[key].__v_isRef) {
        target[key].value = value
        return true
      }
      return Reflect.set(target, key, value, receiver)
    }
  })
}
export function toReactive(value) {
  return isObject(value) ? reactive(value) : value
}
class ObjectRefImpl {
  private __v_isRef = true
  constructor(public object, public key) {}
  get value() {
    return this.object[this.key]
  }
  set value(newValue) {
    this.object[this.key] = newValue
  }
}
class RefImpl {
  private _value
  private dep
  private __v_isRef = true
  constructor(public rawValue) {
    // rawValue 可能是一个对象，
    this._value = toReactive(rawValue)
  }
  get value() {
    trackEffects(this.dep || (this.dep = new Set()))
    // 这里需要依赖收集，取值的时候 需要收集对应的依赖
    return this._value
  }
  set value(newValue) {
    if (newValue != this.rawValue) {
      this._value = toReactive(newValue)
      this.rawValue = newValue
      triggerEffects(this.dep)
    }
  }
}
