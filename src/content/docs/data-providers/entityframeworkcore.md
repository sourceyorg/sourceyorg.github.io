---
title: Data providers - EntityFrameworkCore
description: A guide for setting up entity framework core
---

This guide assumes you have already followed the [Getting started](../getting-started) guide and used the `InMemory` providers.

## Getting started
### Install the package
```
dotnet add package Sourcey.EntityFrameworkCore
```
### Install a Entityframework Core provider
```
dotnet add package Microsoft.EntityFrameworkCore.SqlServer
```
### Set up an event store
#### 1. Setting up a DbContext
##### 1.a Use the predefined EventStoreDbContext
`Sourcey.EntityFrameworkCore` comes with a `EventStoreDbContext` that can be used. Alternatively you can create and use your own following the below steps:
##### 1.b Create a new context using EventStoreDbContextBase<TContext>
```csharp
public sealed class SampleEventStoreDbContext : EventStoreDbContextBase<SampleEventStoreDbContext>
{
    protected override string Schema => "Sample";

    public SampleEventStoreDbContext(DbContextOptions<SampleEventStoreDbContext> options) : base(options)
    {
    }
}
```
##### 1.c Create a new context implemnting the IEventStoreDbContext 
```csharp
public class SampleEventStoreDbContext : DbContext, IEventStoreDbContext
{
    private readonly string _schema = "Sample";

    public DbSet<Event> Events { get; set; }

    public SampleEventStoreDbContext(DbContextOptions<SampleEventStoreDbContext> options)
        : base(options) { }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        builder.ApplyEventConfiguration(_schema);
        base.OnModelCreating(builder);
    }
}
```
#### 2. Register the store
```csharp
Services.AddSourcey(builder =>
{
    builder.AddEvents(e =>
    {
        e.WithEntityFrameworkCoreEventStore<EventStoreDbContext>(x =>
        {
            ....
        },
        // This is the DbContextOptionsBuilder, and will work with any of the Providers avaliable in EntityFrameworkCore.
        // In this sample we'll use the in memory provider, but this can be replaced with anything you'd like
        o =>
        {
            o.UseSqlServer(
                "YourConnectionString",
                b => b.MigrationsAssembly("YourAssembly")
            );
        });
    });
});
```
##### 2.a. Setup projections
```csharp
Services.AddSourcey(builder =>
{
    builder.AddEvents(e =>
    {
        e.WithEntityFrameworkCoreEventStore<EventStoreDbContext>(x =>
        {
            ....
            x.AddProjection<Something>();
        },
        ....
    });
});
```
##### 2.b. Setup aggregates
```csharp
Services.AddSourcey(builder =>
{
    builder.AddEvents(e =>
    {
        e.WithEntityFrameworkCoreEventStore<EventStoreDbContext>(x =>
        {
            ....
            x.AddAggregate<Sampleaggregate, SampleState>();
        },
        ....
    });
});
```
### Setup projection writers
#### 1. Register the writer
```csharp
Services.AddSourcey(builder =>
{
    builder.AddProjection<Something>(x =>
    {
        x.WithManager<SomethingManager>();
        x.WithEntityFrameworkCoreWriter(e =>
        {
            // This is the DbContextOptionsBuilder, and will work with any of the Providers avaliable in EntityFrameworkCore.
            // In this sample we'll use the sql server provider, but this can be replaced with anything you'd like
            e.WithContext<SomethingContext>(o => o.UseSqlServer(
                "YourConnectionString",
                b => b.MigrationsAssembly("YourAssembly")
            ));
        });
    });
});
```
### Setup projection state
#### 1. Setting up a DbContext
```csharp
public class SomethingContext : ProjectionStateDbContext
{
    protected override string Schema => "Sample";

    DbSet<Something> Somethings { get; set;}

    public SomethingContext(DbContextOptions<SomethingContext> options) : base(options)
    {
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Something>(entity =>
        {
            entity.ToTable("Something");
            entity.HasKey(e => e.Subject);
            entity.HasIndex(e => e.Value);
        });

        base.OnModelCreating(modelBuilder);
    }
}
```
#### 2. Register the projection state
```csharp
Services.AddSourcey(builder =>
{
    builder.AddProjection<Something>(x =>
    {
        x.WithManager<SomethingManager>();
        x.WithEntityFrameworkCoreStateManager(e =>
        {
            // This is the DbContextOptionsBuilder, and will work with any of the Providers avaliable in EntityFrameworkCore.
            // In this sample we'll use the in memory provider, but this can be replaced with anything you'd like
            e.WithContext<SomethingContext>(o => o.UseSqlServer(
                "YourConnectionString",
                b => b.MigrationsAssembly("YourAssembly")
            ));
        });
    });
});
```
## Putting it all together
### 1. Your registration should look something like this:
```csharp
Services.AddSourcey(builder =>
{
    builder.AddAggregate<SampleAggreagte, SampleState>();

    builder.AddEvents(e =>
    {
        e.RegisterEventCache<SomethingHappened>();
        e.WithEntityFrameworkCoreEventStore<EventStoreDbContext>(x =>
        {
            x.AddAggregate<SampleAggreagte, SampleState>();
            x.AddProjection<Something>();
        },
        o =>
        {
            o.UseSqlServer(
                "YourConnectionString",
                b => b.MigrationsAssembly("YourAssembly")
            );
        });
    });

    builder.AddProjection<Something>(x =>
    {
        x.WithManager<SomethingManager>();
        x.WithEntityFrameworkCoreWriter(e =>
        {
            e.WithContext<SomethingContext>(o => o.UseSqlServer(
                "YourConnectionString",
                b => b.MigrationsAssembly("YourAssembly")
            ));
        });
        x.WithEntityFrameworkCoreStateManager(e =>
        {
            e.WithContext<SomethingContext>(o => o.UseSqlServer(
                "YourConnectionString",
                b => b.MigrationsAssembly("YourAssembly")
            ));
        });
    });

    builder.AddSerialization(x =>
    {
        x.WithEvents();
        x.WithAggregates();
    });
});
```
### 2. Build the migrations
Now we need to build the EFCore migrations for the eventstore context and our projection context 
#### 2.a Build the event store migrations
```
dotnet ef migrations add AddEventStore -s {PathToYourProject}.csproj -c {YourEventStoreContext} -p {PathToYourProject}csproj -o Migrations/EventStore
```
#### 2.b Build the projection migrations
```
dotnet ef migrations add AddProjections -s {PathToYourProject}.csproj -c {YourProjectionContext} -p {PathToYourProject}csproj -o Migrations/Projections
```
### 3. Execute the the Sourcey initializers
#### 3.a Update the app to run initializers
```csharp
await app.InitializeSourceyAsync();
```
### Your program file should look something like this
```csharp

...

hostBuilder.Services.AddSourcey(builder =>
{
    builder.AddAggregate<SampleAggreagte, SampleState>();

    builder.AddEvents(e =>
    {
        e.RegisterEventCache<SomethingHappened>();
        e.WithEntityFrameworkCoreEventStore<EventStoreDbContext>(x =>
        {
            x.AddAggregate<SampleAggreagte, SampleState>();
            x.AddProjection<Something>();
        },
        o =>
        {
            o.UseSqlServer(
                "YourConnectionString",
                b => b.MigrationsAssembly("YourAssembly")
            );
        });
    });

    builder.AddProjection<Something>(x =>
    {
        x.WithManager<SomethingManager>();
        x.WithEntityFrameworkCoreWriter(e =>
        {
            e.WithContext<SomethingContext>(o => o.UseSqlServer(
                "YourConnectionString",
                b => b.MigrationsAssembly("YourAssembly")
            ));
        });
        x.WithEntityFrameworkCoreStateManager(e =>
        {
            e.WithContext<SomethingContext>(o => o.UseSqlServer(
                "YourConnectionString",
                b => b.MigrationsAssembly("YourAssembly")
            ));
        });
    });

    builder.AddSerialization(x =>
    {
        x.WithEvents();
        x.WithAggregates();
    });
});

var app = builder.Build();

...

await app.InitializeSourceyAsync();
await app.RunAsync();

```
:::tip
See the source code for this [here](https://github.com/sourceyorg/sourcey/tree/main/samples/EntityFrameworkCore)
:::