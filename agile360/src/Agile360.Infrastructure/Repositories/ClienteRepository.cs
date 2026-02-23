using Agile360.Application.Interfaces;
using Agile360.Domain.Entities;
using Agile360.Domain.Interfaces;
using Agile360.Infrastructure.Data;

namespace Agile360.Infrastructure.Repositories;

public class ClienteRepository : Repository<Cliente>, IClienteRepository
{
    public ClienteRepository(SupabaseDataClient client, ICurrentUserService currentUser)
        : base(client, currentUser) { }

    // GET /rest/v1/cliente?cpf=eq.{cpf}&limit=1
    public Task<Cliente?> GetByCpfAsync(string cpf, CancellationToken ct = default) =>
        _client.GetSingleAsync<Cliente>(TableName,
            $"cpf=eq.{Uri.EscapeDataString(cpf)}", Token, ct);

    // GET /rest/v1/cliente?or=(nome_completo.ilike.*t*,cpf.ilike.*t*,telefone.ilike.*t*)
    public Task<IReadOnlyList<Cliente>> SearchAsync(string termo, CancellationToken ct = default)
    {
        var t      = Uri.EscapeDataString($"*{termo}*");
        var filter = $"or=(nome_completo.ilike.{t},cpf.ilike.{t},telefone.ilike.{t})";
        return _client.GetListAsync<Cliente>(TableName, filter, Token, ct);
    }

    // POST múltiplos registros de uma vez
    public async Task<IReadOnlyList<Cliente>> AddRangeAsync(
        IEnumerable<Cliente> clientes, CancellationToken ct = default)
    {
        var result = new List<Cliente>();
        foreach (var c in clientes)
        {
            c.IdAdvogado = _currentUser.AdvogadoId;
            if (c.Id == Guid.Empty) c.Id = Guid.NewGuid();
            var inserted = await _client.InsertAsync<Cliente>(TableName, c, Token, ct);
            if (inserted is not null) result.Add(inserted);
        }
        return result;
    }
}
