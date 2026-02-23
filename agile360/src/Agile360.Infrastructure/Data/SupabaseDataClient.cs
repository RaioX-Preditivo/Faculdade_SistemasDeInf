using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Agile360.Infrastructure.Auth;
using Microsoft.Extensions.Options;

namespace Agile360.Infrastructure.Data;

/// <summary>
/// HTTP client para a Supabase PostgREST Data API.
/// Padrão: TokenAsync → AccessToken → Authorization: Bearer &lt;token&gt; em cada chamada.
/// </summary>
public class SupabaseDataClient
{
    private readonly HttpClient _http;
    private readonly SupabaseAuthOptions _options;

    /// <summary>
    /// Opções de JSON alinhadas ao Supabase/PostgreSQL:
    ///  • SnakeCaseLower   — colunas Supabase seguem snake_case (id, advogado_id, created_at…)
    ///  • CaseInsensitive  — desserializa independentemente do case retornado
    ///  • JsonStringEnum   — enums armazenados como string (ex.: "Ativo", "Pendente")
    ///  • IgnoreNull       — não envia campos nulos no corpo do PATCH/POST
    /// </summary>
    internal static readonly JsonSerializerOptions JsonOpts = new()
    {
        PropertyNamingPolicy          = JsonNamingPolicy.SnakeCaseLower,
        PropertyNameCaseInsensitive   = true,
        DefaultIgnoreCondition        = JsonIgnoreCondition.WhenWritingNull,
        Converters                    = { new JsonStringEnumConverter() }
    };

    public SupabaseDataClient(HttpClient http, IOptions<SupabaseAuthOptions> options)
    {
        _http    = http;
        _options = options.Value;
        _http.BaseAddress = new Uri(_options.BaseUrl.TrimEnd('/') + "/rest/v1/");
        // apikey NÃO vai em DefaultRequestHeaders — é adicionado explicitamente
        // em cada HttpRequestMessage dentro de MakeRequest, para ficar visível
        // no debugger e garantir presença em 100% das chamadas.
    }

    /// <summary>Service role key — bypassa RLS. NUNCA exponha ao cliente.</summary>
    public string ServiceToken => _options.ServiceRoleKey;

    // ─── Leitura ─────────────────────────────────────────────────────────────────

    /// <summary>
    /// GET /rest/v1/{table}?{filter}&amp;limit=1
    /// Authorization: Bearer &lt;accessToken&gt;  ← Supabase RLS é ativado com este token
    /// </summary>
    public async Task<T?> GetSingleAsync<T>(
        string table, string filter, string accessToken, CancellationToken ct = default)
    {
        var url = string.IsNullOrEmpty(filter) ? $"{table}?limit=1" : $"{table}?{filter}&limit=1";
        using var req = MakeRequest(HttpMethod.Get, url, accessToken);
        var res = await _http.SendAsync(req, ct);
        await EnsureSuccessAsync(res, ct);
        var list = await res.Content.ReadFromJsonAsync<List<T>>(JsonOpts, ct);
        return list is { Count: > 0 } ? list[0] : default;
    }

    /// <summary>
    /// GET /rest/v1/{table}?{filter}
    /// Authorization: Bearer &lt;accessToken&gt;
    /// </summary>
    public async Task<IReadOnlyList<T>> GetListAsync<T>(
        string table, string filter, string accessToken, CancellationToken ct = default)
    {
        var url = string.IsNullOrEmpty(filter) ? table : $"{table}?{filter}";
        using var req = MakeRequest(HttpMethod.Get, url, accessToken);
        var res = await _http.SendAsync(req, ct);
        await EnsureSuccessAsync(res, ct);
        return await res.Content.ReadFromJsonAsync<List<T>>(JsonOpts, ct) ?? [];
    }

    // ─── Escrita ──────────────────────────────────────────────────────────────────

    /// <summary>
    /// POST /rest/v1/{table}   Prefer: return=representation
    /// Authorization: Bearer &lt;accessToken&gt;
    /// </summary>
    public async Task<T?> InsertAsync<T>(
        string table, T entity, string accessToken, CancellationToken ct = default)
    {
        using var req = MakeRequest(HttpMethod.Post, table, accessToken);
        req.Headers.TryAddWithoutValidation("Prefer", "return=representation");
        req.Content = new StringContent(
            JsonSerializer.Serialize(entity, JsonOpts), Encoding.UTF8, "application/json");
        var res = await _http.SendAsync(req, ct);
        await EnsureSuccessAsync(res, ct);
        var list = await res.Content.ReadFromJsonAsync<List<T>>(JsonOpts, ct);
        return list is { Count: > 0 } ? list[0] : default;
    }

    /// <summary>
    /// PATCH /rest/v1/{table}?{filter}   Prefer: return=minimal
    /// Authorization: Bearer &lt;accessToken&gt;
    /// </summary>
    public async Task PatchAsync(
        string table, string filter, object body, string accessToken, CancellationToken ct = default)
    {
        using var req = MakeRequest(new HttpMethod("PATCH"), $"{table}?{filter}", accessToken);
        req.Headers.TryAddWithoutValidation("Prefer", "return=minimal");
        req.Content = new StringContent(
            JsonSerializer.Serialize(body, JsonOpts), Encoding.UTF8, "application/json");
        var res = await _http.SendAsync(req, ct);
        await EnsureSuccessAsync(res, ct);
    }

    /// <summary>
    /// DELETE /rest/v1/{table}?{filter}
    /// Authorization: Bearer &lt;accessToken&gt;
    /// </summary>
    public async Task DeleteAsync(
        string table, string filter, string accessToken, CancellationToken ct = default)
    {
        using var req = MakeRequest(HttpMethod.Delete, $"{table}?{filter}", accessToken);
        var res = await _http.SendAsync(req, ct);
        await EnsureSuccessAsync(res, ct);
    }

    // ─── Auxiliares ───────────────────────────────────────────────────────────────

    /// <summary>
    /// Monta um HttpRequestMessage com os dois headers obrigatórios do Supabase
    /// explicitamente no próprio objeto — visíveis no debugger e garantidos em toda chamada.
    ///   apikey:        identifica o projeto Supabase (Anon Key)
    ///   Authorization: autentica o usuário e ativa o RLS
    /// </summary>
    private HttpRequestMessage MakeRequest(HttpMethod method, string url, string accessToken)
    {
        var req = new HttpRequestMessage(method, url);
        req.Headers.TryAddWithoutValidation("apikey", _options.AnonKey);
        req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        return req;
    }

    /// <summary>
    /// Substitui EnsureSuccessStatusCode() para incluir o corpo da resposta do Supabase na exceção,
    /// facilitando o diagnóstico (ex.: "column advogado.id does not exist").
    /// </summary>
    private static async Task EnsureSuccessAsync(HttpResponseMessage res, CancellationToken ct)
    {
        if (res.IsSuccessStatusCode) return;

        var body = string.Empty;
        try { body = await res.Content.ReadAsStringAsync(ct); }
        catch { /* ignora falha de leitura do corpo */ }

        throw new HttpRequestException(
            $"Supabase PostgREST {(int)res.StatusCode} {res.ReasonPhrase}: {body}",
            inner: null,
            statusCode: res.StatusCode);
    }
}
