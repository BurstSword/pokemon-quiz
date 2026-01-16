export interface Pokemon {
  Number: number
  Name: string
  Generation: number
  Legendary: boolean
  Image: string
  Type1: string
  Type2?: string
  Description?: string
}

export interface Option {
  Name: string
  Correct: boolean
  Background: string
}
