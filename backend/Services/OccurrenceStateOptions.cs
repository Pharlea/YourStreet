namespace your_street_server.Services;

public class OccurrenceStateOptions
{
    public const string SectionName = "OccurrenceState";

    public int ResolutionMinVotes { get; set; } = 3;

    public int LifecycleIntervalSeconds { get; set; } = 300;
}
