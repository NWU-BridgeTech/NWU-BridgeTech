FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY BridgeTech.Api.csproj .
RUN dotnet restore BridgeTech.Api.csproj

COPY . .
RUN dotnet publish BridgeTech.Api.csproj \
    --configuration Release \
    --output /app/publish \
    --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app

COPY --from=build /app/publish .

EXPOSE 8080

ENTRYPOINT ["sh", "-c", "dotnet BridgeTech.Api.dll --urls http://0.0.0.0:${PORT:-8080}"]