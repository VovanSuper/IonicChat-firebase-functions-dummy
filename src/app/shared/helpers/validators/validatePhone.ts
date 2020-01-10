import { AbstractControl } from '@angular/forms'

function phoneNumberValidator(control: AbstractControl): { [key: string]: any } | null {
  const phoneReg = /^(\+)?(\s)?(\d)+[\-\d\s?]+$/;
  // const phoneReg = /^[\+]?[\s]?[(]?[\s]?[0-9]{3}[\s]?[)]?[-\s\.]?([0-9]{3}[-\s\.]?[0-9]{4,6})+$/im ;
  const valid = !control.value || (phoneReg.test(control.value));
  return valid ? null : { phone: { valid: false, value: control.value } }
}

export { phoneNumberValidator };