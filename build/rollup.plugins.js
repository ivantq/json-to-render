const alias = require('@rollup/plugin-alias')
const babel = require('@rollup/plugin-babel').babel
const nodeResolve = require('@rollup/plugin-node-resolve').nodeResolve
const commonjs = require('@rollup/plugin-commonjs')
const typescript = require('@rollup/plugin-typescript')
const terser = require('rollup-plugin-terser').terser
const vuePlugin = require('rollup-plugin-vue')
const sizes = require('rollup-plugin-sizes')

module.exports = {
  alias,
  babel,
  nodeResolve,
  commonjs,
  typescript,
  terser,
  vuePlugin,
  sizes,
}
