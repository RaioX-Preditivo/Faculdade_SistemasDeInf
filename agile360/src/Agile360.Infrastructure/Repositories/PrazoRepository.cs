using Agile360.Application.Interfaces;
using Agile360.Domain.Entities;
using Agile360.Domain.Enums;
using Agile360.Domain.Interfaces;
using Agile360.Infrastructure.Data;

namespace Agile360.Infrastructure.Repositories;

public class PrazoRepository : Repository<Prazo>, IPrazoRepository
{
    public PrazoRepository(SupabaseDataClient client, ICurrentUserService currentUser)
        : base(client, currentUser) { }

    // GET /rest/v1/prazos?status=eq.Pendente&data_vencimento=gte.{agora}&data_vencimento=lte.{limite}&order=data_vencimento.asc
    public Task<IReadOnlyList<Prazo>> GetVencimentoProximoAsync(int horasAntes, CancellationToken ct = default)
    {
        var agora  = DateTimeOffset.UtcNow;
        var limite = agora.AddHours(horasAntes);
        var filter = $"status=eq.{StatusPrazo.Pendente}" +
                     $"&data_vencimento=gte.{agora:O}" +
                     $"&data_vencimento=lte.{limite:O}" +
                     $"&order=data_vencimento.asc";
        return _client.GetListAsync<Prazo>(TableName, filter, Token, ct);
    }

    // GET /rest/v1/prazos?status=eq.Pendente&order=data_vencimento.asc
    public Task<IReadOnlyList<Prazo>> GetPendentesAsync(CancellationToken ct = default) =>
        _client.GetListAsync<Prazo>(TableName,
            $"status=eq.{StatusPrazo.Pendente}&order=data_vencimento.asc", Token, ct);

    // GET /rest/v1/prazos?status=eq.Pendente&tipo=eq.Fatal&order=data_vencimento.asc
    public Task<IReadOnlyList<Prazo>> GetFataisAsync(CancellationToken ct = default) =>
        _client.GetListAsync<Prazo>(TableName,
            $"status=eq.{StatusPrazo.Pendente}&tipo=eq.{TipoPrazo.Fatal}&order=data_vencimento.asc",
            Token, ct);
}
