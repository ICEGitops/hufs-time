import * as departmentModel from '../models/department.js'

export function getDepartments(campus) {
  return departmentModel.findAll(campus)
}
