'use strict'

const nopt = require('nopt')
const path = require('path')
const pump = require('pump')
const split2 = require('split2')
const parseJson = require('fast-json-parse')
const { buildOptions } = require('./lib/utils')

const longOpts = {
  modern: Boolean,
  appname: String,
  cee: Boolean,
  facility: Number,
  includeProperties: String,
  messageOnly: Boolean,
  tz: String,
  newline: Boolean,
  structuredData: String,
  config: String,
  sync: Boolean,
  filterProperties: String,
  levelAsText: Boolean
}

const shortOpts = {
  m: '--modern',
  a: '--appname',
  f: '--facility',
  p: '--includeProperties',
  mo: '--messageOnly',
  n: '--newline',
  s: '--structuredData',
  c: '--config',
  sy: '--sync',
  l: '--levelAsText'
}

const args = nopt(longOpts, shortOpts)

let jsonOptions = {}
if (args.config) {
  try {
    jsonOptions = require(path.resolve(args.config))
  } catch (e) {
    process.stderr.write(`could not load settings file, using defaults: ${e.message}`)
  }
}

const options = buildOptions(jsonOptions, args)

let myTransport
if (options.modern) {
  myTransport = require('./lib/rfc5424.js')(options)
} else {
  myTransport = require('./lib/rfc3164.js')(options)
}

function parser (str) {
  const result = parseJson(str)
  if (result.err) return
  return result.value
}

pump(process.stdin, split2(parser), myTransport)
process.on('SIGINT', () => { process.exit(0) })
