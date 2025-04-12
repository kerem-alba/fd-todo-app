using MediatR;
using Todo_App.Application.Common.Exceptions;
using Todo_App.Application.Common.Interfaces;

namespace Todo_App.Application.TodoItems.Commands.RemoveTagFromTodoItem;

public record RemoveTagFromTodoItemCommand(int TodoItemId, int TagId) : IRequest;

public class RemoveTagFromTodoItemCommandHandler : IRequestHandler<RemoveTagFromTodoItemCommand>
{
    private readonly IApplicationDbContext _context;

    public RemoveTagFromTodoItemCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Unit> Handle(RemoveTagFromTodoItemCommand request, CancellationToken cancellationToken)
    {
        var entity = _context.TodoItemTags.FirstOrDefault(x =>
            x.TodoItemId == request.TodoItemId &&
            x.TagId == request.TagId);

        if (entity == null)
        {
            throw new NotFoundException("TodoItemTag", $"ItemId: {request.TodoItemId}, TagId: {request.TagId}");
        }

        _context.TodoItemTags.Remove(entity);

        await _context.SaveChangesAsync(cancellationToken);

        return Unit.Value;
    }
}
