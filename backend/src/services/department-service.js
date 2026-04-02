import * as departmentModel from '../models/department.js'

export async function getDepartments(campus) {
  return departmentModel.findAll(campus)
}
