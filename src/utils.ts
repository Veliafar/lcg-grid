export function splitSortBy(originalString: string): { fieldName: string, direction: string } {
  if (!originalString) {
      return {
          fieldName: null,
          direction: null
      };
  }
  const arr = originalString.split(/\s(asc|desc)$/);
  return {
      fieldName: arr[0],
      direction: arr[1] ? arr[1] : 'asc'
  };
}



/**
   * Скопировать поля в целевой объект из объекта источника без изменения типа целевого объекта или его полей
   
   *
   *
   * @private
   * @param {*} target - целевой объект для копирования
   * @param {*} source - источник копирования значения полей
   * @param {*} [key] - ключ поля
   * @returns
   */
  export function safeObjectTypeAssign(target, source, key?) {
      for (key in source) {
        if (source.hasOwnProperty(key)) {
          const propType = Object.prototype.toString.call(source[key]);
          if (propType === '[object Object]') {
            target[key] = safeObjectTypeAssign(target[key] || {}, source[key]);
          } else { // TODO: Разобраться с заполнением массивов
            target[key] = source[key];
          }
        }
      }
      return target;
  }
