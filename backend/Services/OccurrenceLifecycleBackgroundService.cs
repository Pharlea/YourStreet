using Microsoft.Extensions.Options;

namespace your_street_server.Services;

public class OccurrenceLifecycleBackgroundService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<OccurrenceLifecycleBackgroundService> _logger;
    private readonly IOptionsMonitor<OccurrenceStateOptions> _options;

    public OccurrenceLifecycleBackgroundService(
        IServiceScopeFactory scopeFactory,
        ILogger<OccurrenceLifecycleBackgroundService> logger,
        IOptionsMonitor<OccurrenceStateOptions> options)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
        _options = options;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var lifecycleService = scope.ServiceProvider.GetRequiredService<IOccurrenceLifecycleService>();
                await lifecycleService.RecalculateStatusesAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Falha ao recalcular ciclo de vida das ocorrencias em background");
            }

            var intervalSeconds = Math.Max(30, _options.CurrentValue.LifecycleIntervalSeconds);
            await Task.Delay(TimeSpan.FromSeconds(intervalSeconds), stoppingToken);
        }
    }
}
