export class UserDto {
  email: string;
  password: string;
  privilege: number;
  name: string;
  surname: string;
  mobile: string;
  conformation_string: string;
  verified: boolean;
  token: string;
}

export class UserVerificationDto {
  content: string;
  error: boolean;
  user: UserDto;
}
