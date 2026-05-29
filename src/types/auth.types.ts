export type Login = {
    email: string,
    password: string
}

export type LoginResponse = {
    userId: string,
    email: string,
    jwt: string,
    role: string
}

export type Register = {
    fullName: string,
    email: string,
    phone: string,
    role: string,
    password: string
}