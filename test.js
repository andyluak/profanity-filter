import { checkStopWords } from "profanity-filter-checker"

const STOP_WORDS = [
  'shit', 'cunt'
]

const RELAXED_STOP_WORDS = ['ass']


let isStopWord = checkStopWords()