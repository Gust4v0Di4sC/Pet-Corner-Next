import { useEffect, useMemo, useState } from "react";
import logoimg from "../../assets/Logo.svg";
import AppShell from "../../components/layout/AppShell";
import Main from "../../components/Templates/Main";
import { useOrderOperations } from "../../hooks/useOrderOperations";
import { useToast } from "../../hooks/useToast";
import {
  getDeliveryIssueStatusLabel,
  getOrderStatusDescription,
  getOrderStatusLabel,
} from "../../services/orderTrackingService";
import type { DeliveryIssueStatus, OrderStatus } from "../../types/orderTracking";
import "./pedidos.css";

const ORDER_STATUS_OPTIONS: OrderStatus[] = [
  "pedido_recebido",
  "em_preparacao",
  "em_transporte",
  "entregue",
  "problema_entrega",
  "cancelado",
];

const DELIVERY_ISSUE_STATUS_OPTIONS: Array<DeliveryIssueStatus | "all"> = [
  "all",
  "aberto",
  "em_analise",
  "resolvido",
  "fechado",
];

function formatCurrency(valueInCents: number): string {
  const normalizedValue = Number.isFinite(valueInCents) ? valueInCents : 0;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(normalizedValue / 100);
}

function formatDate(value: string): string {
  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return "--";
  }

  return parsedDate.toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function issueStatusOptionLabel(status: DeliveryIssueStatus | "all"): string {
  if (status === "all") {
    return "Todos";
  }

  return getDeliveryIssueStatusLabel(status);
}

export default function PedidosPage() {
  const toast = useToast();
  const {
    isLoading,
    orders,
    deliveryIssues,
    selectedOrder,
    setSelectedOrderId,
    orderStatusFilter,
    setOrderStatusFilter,
    deliveryIssueStatusFilter,
    setDeliveryIssueStatusFilter,
    orderSearch,
    setOrderSearch,
    issueSearch,
    setIssueSearch,
    reloadOrders,
    reloadDeliveryIssues,
    ordersErrorMessage,
    deliveryIssuesErrorMessage,
    isUpdatingOrderStatus,
    isUpdatingDeliveryIssueStatus,
    updateOrderStatus,
    updateDeliveryIssueStatus,
  } = useOrderOperations();

  const [nextOrderStatus, setNextOrderStatus] = useState<OrderStatus>("pedido_recebido");
  const [issueStatusDrafts, setIssueStatusDrafts] = useState<
    Record<string, DeliveryIssueStatus>
  >({});
  const [issueNotesDrafts, setIssueNotesDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!selectedOrder) {
      return;
    }

    setNextOrderStatus(selectedOrder.status);
  }, [selectedOrder]);

  const activeIssueCount = useMemo(
    () => deliveryIssues.filter((issue) => issue.status === "aberto" || issue.status === "em_analise").length,
    [deliveryIssues]
  );

  const handleRefresh = async () => {
    await Promise.all([reloadOrders(), reloadDeliveryIssues()]);
  };

  const handleApplyOrderStatus = async () => {
    if (!selectedOrder) {
      toast.warning("Selecione um pedido para atualizar.");
      return;
    }

    try {
      await updateOrderStatus(selectedOrder.id, nextOrderStatus);
      toast.success("Status do pedido atualizado com sucesso.");
    } catch (error) {
      toast.warning(
        error instanceof Error && error.message.trim()
          ? error.message
          : "Nao foi possivel atualizar o status do pedido."
      );
    }
  };

  const handleIssueStatusChange = (issueId: string, status: DeliveryIssueStatus) => {
    setIssueStatusDrafts((currentValue) => ({
      ...currentValue,
      [issueId]: status,
    }));
  };

  const handleIssueNotesChange = (issueId: string, notes: string) => {
    setIssueNotesDrafts((currentValue) => ({
      ...currentValue,
      [issueId]: notes,
    }));
  };

  const handleApplyIssueStatus = async (issueId: string, fallbackStatus: DeliveryIssueStatus) => {
    const nextStatus = issueStatusDrafts[issueId] ?? fallbackStatus;
    const triageNotes = issueNotesDrafts[issueId] ?? "";

    try {
      await updateDeliveryIssueStatus(issueId, nextStatus, triageNotes);
      toast.success("Issue de entrega atualizada.");
    } catch (error) {
      toast.warning(
        error instanceof Error && error.message.trim()
          ? error.message
          : "Nao foi possivel atualizar a issue de entrega."
      );
    }
  };

  return (
    <AppShell logoSrc={logoimg} chatFabPlacement="resource-fab">
      <Main
        icon="shopping-bag"
        title="Pedidos"
        subtitle="Operacao de entregas, timeline de pedidos e triagem de problemas"
        fillHeight
        contentClassName="orders-ops-shell"
      >
        <section className="orders-ops">
          <header className="orders-ops__toolbar">
            <div className="orders-ops__filters">
              <label className="orders-ops__field">
                <span>Status do pedido</span>
                <select
                  value={orderStatusFilter}
                  onChange={(event) =>
                    setOrderStatusFilter(event.target.value as OrderStatus | "all")
                  }
                >
                  <option value="all">Todos</option>
                  {ORDER_STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {getOrderStatusLabel(status)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="orders-ops__field orders-ops__field--search">
                <span>Busca de pedido</span>
                <input
                  value={orderSearch}
                  onChange={(event) => setOrderSearch(event.target.value)}
                  placeholder="PED-XXXX, id ou cliente"
                />
              </label>
            </div>

            <button
              type="button"
              className="orders-ops__refresh-button"
              onClick={() => void handleRefresh()}
              disabled={isLoading}
            >
              <i className={`fa ${isLoading ? "fa-spinner fa-spin" : "fa-rotate-right"}`} />
              Atualizar
            </button>
          </header>

          {ordersErrorMessage ? (
            <p className="orders-ops__error">{ordersErrorMessage}</p>
          ) : null}
          {deliveryIssuesErrorMessage ? (
            <p className="orders-ops__error">{deliveryIssuesErrorMessage}</p>
          ) : null}

          <div className="orders-ops__grid">
            <article className="orders-ops__panel orders-ops__panel--list">
              <header className="orders-ops__panel-header">
                <h3>Pedidos</h3>
                <small>{orders.length} resultado(s)</small>
              </header>

              {!orders.length ? (
                <p className="orders-ops__empty">Nenhum pedido encontrado para os filtros atuais.</p>
              ) : (
                <ul className="orders-ops__order-list">
                  {orders.map((order) => (
                    <li key={order.id}>
                      <button
                        type="button"
                        className={`orders-ops__order-item${
                          selectedOrder?.id === order.id ? " is-active" : ""
                        }`}
                        onClick={() => setSelectedOrderId(order.id)}
                      >
                        <div>
                          <strong>{order.orderCode}</strong>
                          <p>{order.customerId}</p>
                        </div>
                        <div className="orders-ops__order-meta">
                          <span>{getOrderStatusLabel(order.status)}</span>
                          <small>{formatDate(order.updatedAtIso)}</small>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </article>

            <article className="orders-ops__panel orders-ops__panel--detail">
              <header className="orders-ops__panel-header">
                <h3>Detalhe do pedido</h3>
                {selectedOrder ? <small>{selectedOrder.orderCode}</small> : null}
              </header>

              {!selectedOrder ? (
                <p className="orders-ops__empty">Selecione um pedido para visualizar detalhes.</p>
              ) : (
                <div className="orders-ops__detail-content">
                  <div className="orders-ops__totals">
                    <article>
                      <span>Subtotal</span>
                      <strong>{formatCurrency(selectedOrder.subtotalInCents)}</strong>
                    </article>
                    <article>
                      <span>Frete</span>
                      <strong>{formatCurrency(selectedOrder.shippingInCents)}</strong>
                    </article>
                    <article>
                      <span>Total</span>
                      <strong>{formatCurrency(selectedOrder.totalInCents)}</strong>
                    </article>
                  </div>

                  <section className="orders-ops__status-editor">
                    <h4>Atualizar status</h4>
                    <p>{getOrderStatusDescription(nextOrderStatus)}</p>
                    <div className="orders-ops__status-actions">
                      <select
                        value={nextOrderStatus}
                        onChange={(event) => setNextOrderStatus(event.target.value as OrderStatus)}
                      >
                        {ORDER_STATUS_OPTIONS.map((status) => (
                          <option key={status} value={status}>
                            {getOrderStatusLabel(status)}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => void handleApplyOrderStatus()}
                        disabled={isUpdatingOrderStatus}
                      >
                        {isUpdatingOrderStatus ? "Salvando..." : "Salvar status"}
                      </button>
                    </div>
                  </section>

                  <section>
                    <h4>Entrega</h4>
                    <p className="orders-ops__detail-line">
                      {selectedOrder.delivery.fullName} - {selectedOrder.delivery.phone}
                    </p>
                    <p className="orders-ops__detail-line">
                      {selectedOrder.delivery.street}, {selectedOrder.delivery.number} -{" "}
                      {selectedOrder.delivery.district}
                    </p>
                    <p className="orders-ops__detail-line">
                      {selectedOrder.delivery.city}/{selectedOrder.delivery.state} - CEP{" "}
                      {selectedOrder.delivery.zipCode}
                    </p>
                    {selectedOrder.delivery.complement ? (
                      <p className="orders-ops__detail-line">
                        Complemento: {selectedOrder.delivery.complement}
                      </p>
                    ) : null}
                  </section>

                  <section>
                    <h4>Itens</h4>
                    <ul className="orders-ops__item-list">
                      {selectedOrder.items.map((item) => (
                        <li key={`${selectedOrder.id}-${item.productId}`}>
                          <span>
                            {item.title} x{item.quantity}
                          </span>
                          <strong>{formatCurrency(item.unitPriceInCents * item.quantity)}</strong>
                        </li>
                      ))}
                    </ul>
                  </section>

                  <section>
                    <h4>Timeline</h4>
                    <ol className="orders-ops__timeline">
                      {selectedOrder.statusTimeline.map((event, index) => (
                        <li key={`${selectedOrder.id}-${event.createdAtIso}-${index}`}>
                          <span>{event.label}</span>
                          <small>{event.description}</small>
                          <time dateTime={event.createdAtIso}>{formatDate(event.createdAtIso)}</time>
                        </li>
                      ))}
                    </ol>
                  </section>
                </div>
              )}
            </article>
          </div>

          <article className="orders-ops__panel orders-ops__panel--issues">
            <header className="orders-ops__panel-header">
              <h3>Problemas de entrega</h3>
              <small>{activeIssueCount} pendente(s)</small>
            </header>

            <div className="orders-ops__filters orders-ops__filters--issues">
              <label className="orders-ops__field">
                <span>Status da issue</span>
                <select
                  value={deliveryIssueStatusFilter}
                  onChange={(event) =>
                    setDeliveryIssueStatusFilter(event.target.value as DeliveryIssueStatus | "all")
                  }
                >
                  {DELIVERY_ISSUE_STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {issueStatusOptionLabel(status)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="orders-ops__field orders-ops__field--search">
                <span>Busca de issue</span>
                <input
                  value={issueSearch}
                  onChange={(event) => setIssueSearch(event.target.value)}
                  placeholder="ticket, PED, cliente ou mensagem"
                />
              </label>
            </div>

            {!deliveryIssues.length ? (
              <p className="orders-ops__empty">Nenhum problema de entrega para os filtros atuais.</p>
            ) : (
              <ul className="orders-ops__issue-list">
                {deliveryIssues.map((issue) => {
                  const issueNextStatus = issueStatusDrafts[issue.id] ?? issue.status;
                  const issueNotes = issueNotesDrafts[issue.id] ?? issue.triageNotes ?? "";

                  return (
                    <li key={issue.id} className="orders-ops__issue-card">
                      <div className="orders-ops__issue-card-header">
                        <div>
                          <strong>{issue.orderCode || issue.id}</strong>
                          <p>Cliente {issue.customerId}</p>
                        </div>
                        <span>{getDeliveryIssueStatusLabel(issue.status)}</span>
                      </div>

                      <p className="orders-ops__issue-message">{issue.message}</p>
                      <p className="orders-ops__issue-meta">
                        Severidade: {issue.severity} | Criado em {formatDate(issue.createdAtIso)}
                      </p>

                      <div className="orders-ops__issue-form">
                        <select
                          value={issueNextStatus}
                          onChange={(event) =>
                            handleIssueStatusChange(
                              issue.id,
                              event.target.value as DeliveryIssueStatus
                            )
                          }
                        >
                          {DELIVERY_ISSUE_STATUS_OPTIONS.filter((status) => status !== "all").map(
                            (status) => (
                              <option key={status} value={status}>
                                {getDeliveryIssueStatusLabel(status)}
                              </option>
                            )
                          )}
                        </select>

                        <input
                          value={issueNotes}
                          onChange={(event) => handleIssueNotesChange(issue.id, event.target.value)}
                          placeholder="Observacao de triagem (opcional)"
                        />

                        <button
                          type="button"
                          onClick={() => void handleApplyIssueStatus(issue.id, issue.status)}
                          disabled={isUpdatingDeliveryIssueStatus}
                        >
                          {isUpdatingDeliveryIssueStatus ? "Salvando..." : "Atualizar issue"}
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </article>
        </section>
      </Main>
    </AppShell>
  );
}

