import XyoLog from './Log'

class XyoBase {
  protected log = XyoLog.get(this.constructor.name)
}

export default XyoBase
