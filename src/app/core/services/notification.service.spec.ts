import { TestBed } from '@angular/core/testing';

import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NotificationService);
  });

  it('adds notifications of each type', () => {
    service.success('saved');
    service.error('failed');
    service.warning('careful');
    service.info('fyi');

    expect(service.notifications().map((n) => n.type)).toEqual(['success', 'error', 'warning', 'info']);
  });

  it('does not stack an identical message twice', () => {
    service.error('same');
    service.error('same');

    expect(service.notifications().length).toBe(1);
  });

  it('dismisses by id and clears all', () => {
    service.info('one', { durationMs: 0 });
    service.info('two', { durationMs: 0 });
    const [first] = service.notifications();

    service.dismiss(first.id);
    expect(service.notifications().map((n) => n.message)).toEqual(['two']);

    service.clear();
    expect(service.notifications()).toEqual([]);
  });
});
