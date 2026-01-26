import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { userMock } from '../../testing/user.mock';

describe('UserService Tests', () => {
  let service: UserService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserService],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it('Should be defined', () => {
    expect(service).toBeDefined();
  });

  it('Should get user ', async () => {
    const email: string = 'test@test.com';
    service.findOne = jest.fn().mockReturnValueOnce(userMock);
    const result = await service.findOne('teste@teste.com');
    expect(result?.email).toEqual(email);
  });

  it('Should create user ', async () => {
    const userCreateMock = {
      email: 'test@test.com',
      name: 'test',
      password: 'teste123',
    };

    service.create = jest.fn().mockReturnValueOnce(userMock);
    const result = await service.create(userCreateMock);
    expect(result?.email).toEqual(userCreateMock.email);
  });
});
