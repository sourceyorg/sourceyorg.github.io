---
title: Reading projections
description: A guide for reading projections
---

Sourcey comes with a `IProjectionReader<TProjection>` interface that can be used to retrieve projections. Below explains some of the ways you can retrieve projections using this interface.

## Retrieving a single projection
### Optimisitc retrieval
To retrieve the current state of a projection you can exeucte something like the following code:
```csharp
internal sealed class GetAProjection
{
    private readonly IProjectionReader<SampleProjection> _projectionReader;

    public GetAProjection(IProjectionReader<SampleProjection> projectionReader) => _projectionReader = projectionReader;

    public async ValueTask<SampleProjection> GetProjectionAsync(string someId, CancellationToken cancellationToken)
        => _projectionReader.ReadAsync(someId, cancellationToken);
}
```
### Eventual consistency
If you need to ensure eventual consistency of your projection. e.g. a user has just added an event to be projected then you can hook into the following override:
```csharp
internal sealed class GetAProjection
{
    private readonly IProjectionReader<SampleProjection> _projectionReader;

    public GetAProjection(IProjectionReader<SampleProjection> projectionReader) => _projectionReader = projectionReader;

    public async ValueTask<SampleProjection> GetProjectionAsync(string someId, int expectedVersion, CancellationToken cancellationToken)
        => _projectionReader.ReadWithConsistencyAsync(
                subject: someId,
                // This can be anything you want to check to ensure that the projection is at the state you expect.
                consistencyCheck: projection => projection.Version >= expectedVersion,
                retryCount: 3,
                delay: TimeSpan.FromMilliseconds(50),
                cancellationToken: cancellationToken
            );
}
```
## Retrieving all projections
### Optimisitc retrieval
To retrieve all the projections using a keyword search you can follow something like the code below:
```csharp
internal sealed class GetAllProjections
{
    private readonly IProjectionReader<SampleProjection> _projectionReader;

    public GetAProjection(IProjectionReader<SampleProjection> projectionReader) => _projectionReader = projectionReader;

    public async ValueTask<IEnumerable<SampleProjection>> GetAllProjectionsAsync(string keyword, CancellationToken cancellationToken)
    {
        await using var query = await _projectionReader.ReadAllAsync(cancellationToken);

        // The query here is of type IQueryable<SampleProjection> so you can use anything avaliable to that api.
        query.Where(x => x.SomeField.Contains(keyword));

        // if using the EF Core provider you can also execute the async apis. e.g. ToArrayAsync();
        return query.ToArray();
    }
}
```
### Eventual consistency
You can also do some consistency checks on the entire projection resultset or an inidvidual projection.
#### Consistency check on all projections
```csharp
internal sealed class GetAllProjections
{
    private readonly IProjectionReader<SampleProjection> _projectionReader;

    public GetAProjection(IProjectionReader<SampleProjection> projectionReader) => _projectionReader = projectionReader;

    public async ValueTask<IEnumerable<SampleProjection>> GetAllProjectionsAsync(string keyword, int expectedCount, CancellationToken cancellationToken)
    {
        await using var query = await _projectionReader.ReadAllWithConsistencyAsync(
            consistencyCheckAsync: query => new(query.Count() >= expectedCount),
            retryCount: 3,
            delay: TimeSpan.FromMilliseconds(50),
            cancellationToken: cancellationToken
        );

        // The query here is of type IQueryable<SampleProjection> so you can use anything avaliable to that api.
        query.Where(x => x.SomeField.Contains(keyword));
        
        // if using the EF Core provider you can also execute the async apis. e.g. ToArrayAsync();
        return query.ToArray();
    }
}
#### Consistency check with a specific projection
```csharp
internal sealed class GetAllProjections
{
    private readonly IProjectionReader<SampleProjection> _projectionReader;

    public GetAProjection(IProjectionReader<SampleProjection> projectionReader) => _projectionReader = projectionReader;

    public async ValueTask<IEnumerable<SampleProjection>> GetAllProjectionsAsync(string keyword, int expectedVersion, CancellationToken cancellationToken)
    {
        await using var query = await _projectionReader.ReadAllWithConsistencyAsync(
            consistencyCheck: projection => projection.Version >= expectedVersion,
            retryCount: 3,
            delay: TimeSpan.FromMilliseconds(50),
            cancellationToken: cancellationToken
        );

        // The query here is of type IQueryable<SampleProjection> so you can use anything avaliable to that api.
        query.Where(x => x.SomeField.Contains(keyword));
        
        // if using the EF Core provider you can also execute the async apis. e.g. ToArrayAsync();
        return query.ToArray();
    }
}
```