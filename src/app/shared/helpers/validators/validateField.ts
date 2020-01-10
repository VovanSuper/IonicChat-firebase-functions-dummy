import { AbstractControl } from '@angular/forms';

function ValidateField(input: AbstractControl) {
  return (input && (input.valid || input.pristine || input.untouched)) || (typeof input.value === 'string' && !input.value.trim().length);
}

function ValidateForm(form: AbstractControl) {
  return (form && form.valid);
}

function ValidateMsg(input: AbstractControl, inputname: string) {
  let error = ((input.errors) ?
    ((input.errors.required) ? `${inputname} is required`
      : (input.errors.minlength) ? `${inputname} invalid (too short)`
        : (input.errors.email) ? `Invalid email`
          : (input.errors.phone) ? `Invalid phone format`
            : null)
    : null)
  return { err: (error && error !== undefined), errmsg: error }
}

export { ValidateField, ValidateForm, ValidateMsg };
