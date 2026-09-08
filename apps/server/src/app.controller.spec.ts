import { Test, type TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let controller: AppController;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    controller = moduleRef.get<AppController>(AppController);
  });

  it('is wired up by the DI container', () => {
    expect(controller).toBeDefined();
  });

  it('answers the health probe with the service result', () => {
    expect(controller.getHealth()).toEqual({ status: 'ok' });
  });

  it('delegates to AppService rather than answering by itself', () => {
    const service = new AppService();
    const spy = vi
      .spyOn(service, 'getHealth')
      .mockReturnValue({ status: 'from-service' });

    const withStub = new AppController(service);

    expect(withStub.getHealth()).toEqual({ status: 'from-service' });
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
