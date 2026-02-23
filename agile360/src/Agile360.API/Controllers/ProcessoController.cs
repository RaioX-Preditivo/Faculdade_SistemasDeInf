using Agile360.Application.Processos.DTOs;
using Agile360.Domain.Entities;
using Agile360.Domain.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Agile360.API.Controllers;

[Authorize]
[ApiController]
[Route("api/processos")]
public class ProcessoController(IProcessoRepository repo) : ControllerBase
{
    // GET /api/processos
    [HttpGet]
    public async Task<IActionResult> Listar(CancellationToken ct)
    {
        var lista = await repo.GetAllAsync(ct);
        return Ok(lista.Select(ToResponse));
    }

    // GET /api/processos/{id}
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Obter(Guid id, CancellationToken ct)
    {
        var p = await repo.GetByIdAsync(id, ct);
        return p is null ? NotFound() : Ok(ToResponse(p));
    }

    // POST /api/processos
    [HttpPost]
    public async Task<IActionResult> Criar([FromBody] CriarProcessoRequest req, CancellationToken ct)
    {
        var entity = FromCriar(req);
        var criado = await repo.AddAsync(entity, ct);
        return CreatedAtAction(nameof(Obter), new { id = criado.Id }, ToResponse(criado));
    }

    // PUT /api/processos/{id}
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Atualizar(Guid id, [FromBody] AtualizarProcessoRequest req, CancellationToken ct)
    {
        var existente = await repo.GetByIdAsync(id, ct);
        if (existente is null) return NotFound();

        AplicarAtualizacao(existente, req);
        await repo.UpdateAsync(existente, ct);
        return NoContent();
    }

    // DELETE /api/processos/{id}
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Excluir(Guid id, CancellationToken ct)
    {
        var existente = await repo.GetByIdAsync(id, ct);
        if (existente is null) return NotFound();

        await repo.RemoveAsync(existente, ct);
        return NoContent();
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private static Processo FromCriar(CriarProcessoRequest r) => new()
    {
        IdCliente          = r.IdCliente,
        NumProcesso        = r.NumProcesso,
        Status             = r.Status,
        ParteContraria     = r.ParteContraria,
        Tribunal           = r.Tribunal,
        ComarcaVara        = r.ComarcaVara,
        Assunto            = r.Assunto,
        ValorCausa         = r.ValorCausa,
        HonorariosEstimados= r.HonorariosEstimados,
        FaseProcessual     = r.FaseProcessual,
        DataDistribuicao   = r.DataDistribuicao,
        Observacoes        = r.Observacoes,
    };

    private static void AplicarAtualizacao(Processo p, AtualizarProcessoRequest r)
    {
        p.IdCliente          = r.IdCliente;
        p.NumProcesso        = r.NumProcesso;
        p.Status             = r.Status;
        p.ParteContraria     = r.ParteContraria;
        p.Tribunal           = r.Tribunal;
        p.ComarcaVara        = r.ComarcaVara;
        p.Assunto            = r.Assunto;
        p.ValorCausa         = r.ValorCausa;
        p.HonorariosEstimados= r.HonorariosEstimados;
        p.FaseProcessual     = r.FaseProcessual;
        p.DataDistribuicao   = r.DataDistribuicao;
        p.Observacoes        = r.Observacoes;
    }

    private static ProcessoResponse ToResponse(Processo p) => new(
        p.Id, p.IdAdvogado, p.IdCliente,
        p.NumProcesso, p.Status, p.ParteContraria,
        p.Tribunal, p.ComarcaVara, p.Assunto,
        p.ValorCausa, p.HonorariosEstimados, p.FaseProcessual,
        p.DataDistribuicao, p.Observacoes, p.CriadoEm);
}
