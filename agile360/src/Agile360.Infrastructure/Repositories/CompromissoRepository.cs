using Agile360.Application.Interfaces;
using Agile360.Domain.Entities;
using Agile360.Domain.Interfaces;
using Agile360.Infrastructure.Data;

namespace Agile360.Infrastructure.Repositories;

public class CompromissoRepository : Repository<Compromisso>, ICompromissoRepository
{
    public CompromissoRepository(SupabaseDataClient client, ICurrentUserService currentUser)
        : base(client, currentUser) { }

    // GET /rest/v1/compromisso?data=eq.{hoje}&order=hora.asc
    public Task<IReadOnlyList<Compromisso>> GetHojeAsync(CancellationToken ct = default)
    {
        var hoje   = DateOnly.FromDateTime(DateTime.UtcNow);
        return _client.GetListAsync<Compromisso>(TableName,
            $"data=eq.{hoje:yyyy-MM-dd}&order=hora.asc", Token, ct);
    }

    // GET /rest/v1/compromisso?data=gte.{hoje}&data=lte.{hoje+6d}&order=data.asc,hora.asc
    public Task<IReadOnlyList<Compromisso>> GetSemanaAsync(CancellationToken ct = default)
    {
        var inicio = DateOnly.FromDateTime(DateTime.UtcNow);
        var fim    = inicio.AddDays(6);
        return _client.GetListAsync<Compromisso>(TableName,
            $"data=gte.{inicio:yyyy-MM-dd}&data=lte.{fim:yyyy-MM-dd}&order=data.asc,hora.asc",
            Token, ct);
    }

    // GET próximo agendado a partir de agora &limit=1
    public Task<Compromisso?> GetProximoAsync(CancellationToken ct = default)
    {
        var hoje = DateOnly.FromDateTime(DateTime.UtcNow);
        return _client.GetSingleAsync<Compromisso>(TableName,
            $"data=gte.{hoje:yyyy-MM-dd}&status=eq.Agendado&order=data.asc,hora.asc",
            Token, ct);
    }
}
