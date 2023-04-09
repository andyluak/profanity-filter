import { checkStopWords } from './dist/index.min.js'

const STOP_WORDS = [
  'shit', 'cunt'
]

const RELAXED_STOP_WORDS = ['ass']


let isStopWord = checkStopWords()