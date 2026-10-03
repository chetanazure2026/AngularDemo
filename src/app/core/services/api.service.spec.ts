import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { ApiService } from './api.service';

interface Sample {
  readonly id: string;
}

describe('ApiService', () => {
  let api: ApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(ApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('prefixes paths with the API base URL and drops empty query params', () => {
    let received: Sample | undefined;
    api.get<Sample>('/api/tasks', { params: { pageNumber: 2, searchText: '', status: undefined, flag: false } })
      .subscribe((r) => (received = r));

    const req = http.expectOne((r) => r.url === `${environment.apiBaseUrl}/api/tasks`);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('pageNumber')).toBe('2');
    expect(req.request.params.get('flag')).toBe('false');
    expect(req.request.params.has('searchText')).toBe(false);
    expect(req.request.params.has('status')).toBe(false);

    req.flush({ id: 'abc' });
    expect(received?.id).toBe('abc');
  });

  it('sends typed bodies for post, put and patch', () => {
    api.post<string, Sample>('api/tasks', { id: '1' }).subscribe();
    api.put<Sample, Sample>('api/tasks/1', { id: '1' }).subscribe();
    api.patch<Sample, { status: string }>('api/tasks/1/status', { status: 'Done' }).subscribe();
    api.delete('api/tasks/1').subscribe();

    expect(http.expectOne({ method: 'POST' }).request.body).toEqual({ id: '1' });
    expect(http.expectOne({ method: 'PUT' }).request.body).toEqual({ id: '1' });
    expect(http.expectOne({ method: 'PATCH' }).request.body).toEqual({ status: 'Done' });
    expect(http.expectOne({ method: 'DELETE' }).request.url).toBe(`${environment.apiBaseUrl}/api/tasks/1`);
  });
});
