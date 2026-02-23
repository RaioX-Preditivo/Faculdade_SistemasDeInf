using Agile360.Application.Interfaces;
using Agile360.Domain.Entities;
using Agile360.Domain.Enums;
using Agile360.Domain.Interfaces;
using Agile360.Infrastructure.Data;

namespace Agile360.Infrastructure.Repositories;

public class ProcessoRepository : Repository<Processo>, IProcessoRepository
{
    public ProcessoRepository(SupabaseDataClient client, ICurrentUserService currentUser)
        : base(client, currentUser) { }

    // GET /rest/v1/processo?num_processo=eq.{numero}&limit=1
    public Task<Processo?> GetByNumeroAsync(string numero, CancellationToken ct = default) =>
        _client.GetSingleAsync<Processo>(TableName,
            $"num_processo=eq.{Uri.EscapeDataString(numero)}", Token, ct);

    // GET /rest/v1/processo?order=id.desc&limit={count}
    public Task<IReadOnlyList<Processo>> GetRecentesAsync(int count, CancellationToken ct = default) =>
        _client.GetListAsync<Processo>(TableName,
            $"order=id.desc&limit={count}", Token, ct);

    // GET /rest/v1/processo?status=eq.{status}
    public Task<IReadOnlyList<Processo>> GetByStatusAsync(StatusProcesso status, CancellationToken ct = default) =>
        _client.GetListAsync<Processo>(TableName,
            $"status=eq.{status}", Token, ct);
}
