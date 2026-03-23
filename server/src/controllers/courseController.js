import Course from '../models/Course.js'

/** GET /api/courses — public, returns active courses */
export async function getAll(req, res, next) {
  try {
    const courses = await Course.find({ isActive: true })
      .populate('subjectIds', 'name emoji color')
      .lean()
    res.json(courses)
  } catch (err) { next(err) }
}

/** GET /api/courses/:id — public, single course detail */
export async function getOne(req, res, next) {
  try {
    const course = await Course.findById(req.params.id)
      .populate('subjectIds', 'name emoji color')
      .lean()
    if (!course) return res.status(404).json({ error: 'Course not found' })
    res.json(course)
  } catch (err) { next(err) }
}

/** POST /api/admin/courses [admin] */
export async function create(req, res, next) {
  try {
    const { title, description, price, thumbnail, features, subjectIds } = req.body
    if (!title || !price) return res.status(400).json({ error: 'title and price are required' })
    const course = await Course.create({ title, description, price, thumbnail, features, subjectIds })
    res.status(201).json(course)
  } catch (err) { next(err) }
}

/** PUT /api/admin/courses/:id [admin] */
export async function update(req, res, next) {
  try {
    const course = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
    if (!course) return res.status(404).json({ error: 'Course not found' })
    res.json(course)
  } catch (err) { next(err) }
}

/** DELETE /api/admin/courses/:id [admin] */
export async function remove(req, res, next) {
  try {
    await Course.findByIdAndDelete(req.params.id)
    res.json({ message: 'Course deleted' })
  } catch (err) { next(err) }
}
